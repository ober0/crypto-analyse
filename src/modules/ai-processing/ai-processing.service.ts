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
            if (bot.lastCheckAt && bot.lastCheckAt > new Date()) {
                return false;
            }
            return true;
        });

        const tickers = Object.fromEntries((await this.tickerService.getAll()).map(({ id, name }) => [id, name]));

        const limit = pLimit(10);

        const count: number = 0;
        const newTrades: number = 0;

        await Promise.all(
            filteredBots.map(async (bot) => {
                return limit(async () => {
                    const tools = [this.toolsService.indicatorsTool, this.toolsService.marketDataTool];
                    if (bot.withWebSearch) {
                        tools.push(this.toolsService.webSearchTool);
                    }

                    const tickerName = tickers[bot.tickersId];

                    const model = this.getModel(bot.model).bindTools(tools);

                    const aiData = await this.aiService.openTrade({
                        model,
                        ticker: tickerName,
                        customPrompt: bot.customPrompt
                    });

                    if (aiData.error) {
                        this.logger.error(aiData.error);
                        return;
                    }

                    const { usage, response } = aiData;

                    // TODO обработка ответа
                });
            })
        );
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
}
