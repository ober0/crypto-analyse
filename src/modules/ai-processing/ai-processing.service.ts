import { Injectable, Logger } from "@nestjs/common";
import { TickersService } from "../tickers/tickers.service";
import { MarketDataService } from "../market-data/market-data.service";
import pLimit from "p-limit";
import { AiProcessingRepository } from "./ai-processing.repository";
import { DirectionEnum, Trade, TradeCloseReason, TradeDirection } from "@prisma/client";

@Injectable()
export class AiProcessingService {
    private logger: Logger = new Logger("AiProcessingService");

    constructor(
        private readonly tickerService: TickersService,
        private readonly marketDataService: MarketDataService,
        private readonly repository: AiProcessingRepository
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
        const limit = pLimit(3);

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
}
