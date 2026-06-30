import { Injectable, Logger } from "@nestjs/common";
import { TickersService } from "../tickers/tickers.service";
import { MarketDataService } from "../market-data/market-data.service";
import pLimit from "p-limit";
import { AiProcessingRepository } from "./ai-processing.repository";
import { Models, Trade, TradeCloseReason, TradeDirection, TradeStatus } from "@prisma/client";
import { ToolsService } from "../ai/services/tools.service";
import { AiService } from "../ai/services/ai.service";
import { ChatOpenAI } from "@langchain/openai";
import { deepseekChat, llamaChat, openAiChat } from "../ai/models/models";
import { Decimal } from "@prisma/client/runtime/library";
import { ManageBotActionEnum } from "../ai/response-schemas/close-trade";

@Injectable()
export class AiProcessingService {
    private logger: Logger = new Logger("AiProcessingService");

    constructor(
        private readonly tickerService: TickersService,
        private readonly marketDataService: MarketDataService,
        private readonly repository: AiProcessingRepository,
        private readonly toolsService: ToolsService,
        private readonly aiService: AiService
    ) {}

    async actualizeTickerData() {
        const tickers = await this.tickerService.getAll();

        const actualPrice: Record<number, number> = {};

        await Promise.all(
            tickers.map(async (ticker) => {
                const candles = await this.marketDataService.getSymbolData({
                    interval: "1",
                    symbol: ticker.name,
                    candles: 1
                });

                const price = candles.at(0)?.close;

                if (price) {
                    actualPrice[ticker.id] = price;
                }
            })
        );

        const trades = await this.repository.getAllActiveTrades();

        await this.actualizePriceAndPnl(actualPrice, trades);
        await this.actualizeStatus(actualPrice, trades);
    }

    private async actualizePriceAndPnl(actualPrice: Record<number, number>, trades: Trade[]) {
        const limit = pLimit(10);

        let count: number = 0;

        await Promise.all(
            trades.map(async (trade) => {
                return limit(async () => {
                    const tickerId = trade.tickerId;
                    const price = actualPrice[tickerId];

                    if (price) {
                        const entry = Number(trade.averageEntryPrice);
                        const size = Number(trade.currentSize);

                        const pnl =
                            trade.direction === TradeDirection.Long ? (price - entry) * size : (entry - price) * size;

                        await this.repository.updateTrade(trade.id, { price, pnl });

                        count++;
                    }
                });
            })
        );

        this.logger.debug(`Успешно актуализирована цена у ${count} трейдов`);
    }

    private async actualizeStatus(actualPrice: Record<number, number>, trades: Trade[]) {
        const slTrades = trades.filter((trade) => {
            if (!trade.stopLoss) {
                return false;
            }

            const price = actualPrice[trade.tickerId];

            return trade.direction === TradeDirection.Long
                ? price <= Number(trade.stopLoss)
                : price >= Number(trade.stopLoss);
        });

        const slTradesIds = slTrades.map((trade) => trade.id);

        const tpTrades = trades.filter((trade) => {
            if (!trade.takeProfit) {
                return false;
            }

            if (slTradesIds.includes(trade.id)) {
                return false;
            }

            const price = actualPrice[trade.tickerId];

            return trade.direction === TradeDirection.Long
                ? price >= Number(trade.takeProfit)
                : price <= Number(trade.takeProfit);
        });

        let count = 0;

        await Promise.all([
            ...slTrades.map(async (trade) => {
                const price = actualPrice[trade.tickerId];
                const entry = Number(trade.averageEntryPrice);
                const size = Number(trade.currentSize);

                const pnl = trade.direction === TradeDirection.Long ? (price - entry) * size : (entry - price) * size;

                await this.repository.closeTrade(trade.id, {
                    closeReason: TradeCloseReason.Sl,
                    description: "Закрыто автоматически по sl",
                    size,
                    price,
                    pnl
                });

                count++;
            }),
            ...tpTrades.map(async (trade) => {
                const price = actualPrice[trade.tickerId];
                const entry = Number(trade.averageEntryPrice);
                const size = Number(trade.currentSize);

                const pnl = trade.direction === TradeDirection.Long ? (price - entry) * size : (entry - price) * size;

                await this.repository.closeTrade(trade.id, {
                    closeReason: TradeCloseReason.Tp,
                    description: "Закрыто автоматически по tp",
                    size,
                    price,
                    pnl
                });

                count++;
            })
        ]);

        this.logger.debug(`Успешно закрыто ${count} сделок по sl/tp`);
    }

    async closeBots() {
        const bots = await this.repository.getAllActiveBots();

        await Promise.all(
            bots.map(async (bot) => {
                if (bot.endAt && bot.endAt?.getTime() > Date.now()) {
                    return;
                }

                if (bot.trades.some((trade) => trade.status === TradeStatus.Open)) {
                    return;
                }

                await this.repository.disable(bot.id);
            })
        );
    }

    async createTrades() {
        const bots = await this.repository.getAllActiveBots();

        const filteredBots = bots.filter((bot) => {
            if (bot.nextCheckAt && bot.nextCheckAt > new Date()) {
                return false;
            }
            return true;
        });

        const tickersEntities = await this.tickerService.getAll();

        const tickers = Object.fromEntries(tickersEntities.map(({ id, name }) => [id, name]));

        const limit = pLimit(10);

        let count: number = 0;
        let newTrades: number = 0;

        const symbolDataEntries = await Promise.all(
            tickersEntities.map(async (ticker) => {
                const marketData = await this.marketDataService
                    .getSymbolData({
                        interval: "1",
                        candles: 1,
                        symbol: ticker.name
                    })
                    .then((el) => el.at(0));

                return [ticker.id, marketData?.close ?? 0] as const;
            })
        ).catch((err) => {
            this.logger.error(err);
        });

        if (!symbolDataEntries) {
            return;
        }

        const symbolData = Object.fromEntries(symbolDataEntries);

        await Promise.all(
            filteredBots.map(async (bot) => {
                return limit(async () => {
                    const tools = [this.toolsService.indicatorsTool, this.toolsService.marketDataTool];
                    if (bot.withWebSearch) {
                        tools.push(this.toolsService.webSearchTool);
                    }

                    const tickerName = tickers[bot.tickersId];

                    const price = symbolData[bot.tickersId];

                    const model = this.getModel(bot.model).bindTools(tools);

                    let aiData;

                    try {
                        aiData = await this.aiService.openTrade({
                            model,
                            ticker: tickerName,
                            customPrompt: bot.customPrompt,
                            price,
                            tools
                        });
                    } catch (err) {
                        this.logger.error(err);
                        return;
                    }

                    if (aiData.error) {
                        this.logger.error(aiData.error);
                        return;
                    }

                    const { usage, response } = aiData;

                    count++;

                    if (response.isTradeOpen && response.trade) {
                        await this.repository.createTrade(
                            bot.id,
                            response.trade,
                            response.description,
                            bot.tickersId,
                            price
                        );

                        newTrades++;
                        this.logger.log(`Трейд ${tickerName} создан`);
                    } else {
                        await this.repository.passTrade(bot.id, response.description);
                    }

                    await Promise.all([
                        this.repository.updateCheck(
                            bot.id,
                            new Date(),
                            new Date(Date.now() + bot.checkIntervalMins * 60 * 1000)
                        ),
                        this.repository.createBotUsage(bot.id, usage, bot.model)
                    ]);
                });
            })
        );

        this.logger.log(`Обработано ${count}, сделок ${newTrades} (открытие)`);
    }

    private getModel(model: Models): ChatOpenAI {
        switch (model) {
            case Models.Deepseek4Flash:
                return deepseekChat;
            case Models.Gpt5:
                return openAiChat;
            case Models.Llama4:
                return llamaChat;
        }
    }

    async processTrades() {
        const trades = await this.repository.getAllActiveTradesWithRelations();

        const filteredTrades = trades.filter((trade) => {
            if (trade.aiProcessing.nextCheckAt && trade.aiProcessing.nextCheckAt > new Date()) {
                return false;
            }
            return true;
        });

        const tickersEntities = await this.tickerService.getAll();

        const tickers = Object.fromEntries(tickersEntities.map(({ id, name }) => [id, name]));

        const limit = pLimit(10);

        let count: number = 0;

        const symbolDataEntries = await Promise.all(
            tickersEntities.map(async (ticker) => {
                const marketData = await this.marketDataService
                    .getSymbolData({
                        interval: "1",
                        candles: 1,
                        symbol: ticker.name
                    })
                    .then((el) => el.at(0));

                return [ticker.id, marketData?.close ?? 0] as const;
            })
        ).catch((err) => {
            this.logger.error(err);
        });

        if (!symbolDataEntries) {
            return;
        }

        const symbolData = Object.fromEntries(symbolDataEntries);

        await Promise.all(
            filteredTrades.map(async (trade) => {
                return limit(async () => {
                    const tools = [this.toolsService.indicatorsTool, this.toolsService.marketDataTool];
                    if (trade.aiProcessing.withWebSearch) {
                        tools.push(this.toolsService.webSearchTool);
                    }

                    const tickerName = tickers[trade.aiProcessing.tickersId];

                    const price = symbolData[trade.aiProcessing.tickersId];

                    const model = this.getModel(trade.aiProcessing.model).bindTools(tools);

                    const normalizeTrade = (value: unknown) => {
                        if (value instanceof Decimal) {
                            return Number(value);
                        }

                        if (Array.isArray(value)) {
                            return value.map(normalizeTrade);
                        }

                        if (value !== null && typeof value === "object") {
                            Object.entries(value).forEach(([key, val]) => {
                                (value as Record<string, unknown>)[key] = normalizeTrade(val);
                            });
                        }

                        return value;
                    };

                    const normalTrade = normalizeTrade(trade);

                    let aiData;

                    try {
                        aiData = await this.aiService.processTrade({
                            trade: normalTrade,
                            model,
                            ticker: tickerName,
                            customPrompt: trade.aiProcessing.customPrompt,
                            price,
                            tools
                        });
                    } catch (err) {
                        this.logger.error(err);
                        return;
                    }

                    if (aiData.error || !aiData.response.action) {
                        this.logger.error(aiData.error ?? "Нет действия");
                        return;
                    }

                    const { usage, response } = aiData;
                    const { action, ...rest } = response;

                    count++;

                    if (action?.action === ManageBotActionEnum.HOLD) {
                        await this.repository.passTrade(trade.aiProcessingId, action.reasoning);
                    } else if (action?.action === ManageBotActionEnum.CLOSE) {
                        const pnl =
                            normalTrade.currentSize *
                            ((price - normalTrade.averageEntryPrice) *
                                (trade.direction === TradeDirection.Long ? 1 : -1));

                        await this.repository.closeTrade(trade.id, {
                            closeReason: "Signal",
                            description: action.reasoning,
                            size: normalTrade.currentSize,
                            price,
                            pnl
                        });
                    } else if (action?.action === ManageBotActionEnum.ADD_POSITION && action.addPercent) {
                        const addSize = normalTrade.currentSize * (action.addPercent / 100);
                        const totalSize = normalTrade.currentSize + addSize;
                        const avgPrice = normalTrade.currentSize * normalTrade.averageEntryPrice + addSize * price;

                        await this.repository.addTrade(trade.id, {
                            description: action.reasoning,
                            size: totalSize,
                            newSize: addSize,
                            price,
                            avgPrice: avgPrice
                        });
                    } else if (action?.action === ManageBotActionEnum.PARTIAL_CLOSE && action.closePercent) {
                        const sellSize = normalTrade.currentSize * (action.closePercent / 100);
                        const totalSize = normalTrade.currentSize - sellSize;

                        await this.repository.partialSellTrade(trade.id, {
                            description: action.reasoning,
                            size: totalSize,
                            newSize: sellSize,
                            price
                        });
                    }

                    if (action?.updateStopLoss || action?.updateTakeProfit) {
                        const newTP = action.takeProfit ?? Number(trade.takeProfit);
                        const newSL = action.stopLoss ?? Number(trade.stopLoss);

                        await this.repository.updateSlTp(
                            trade.id,
                            newTP,
                            newSL,
                            Number(trade.takeProfit),
                            Number(trade.stopLoss)
                        );
                    }

                    await Promise.all([
                        this.repository.updateCheck(
                            trade.aiProcessing.id,
                            new Date(),
                            new Date(Date.now() + trade.aiProcessing.checkIntervalMins * 60 * 1000)
                        ),
                        this.repository.createBotUsage(trade.aiProcessing.id, usage, trade.aiProcessing.model)
                    ]);
                });
            })
        );
        this.logger.log(`Обработано ${count} (процессинг)`);
    }
}
