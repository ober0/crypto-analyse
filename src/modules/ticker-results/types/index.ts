import { DirectionEnum, Models, TickerProcessing, Tickers, TimeframeEnum } from "@prisma/client";

export type CreateTickerProcessingDto = {
    tickerId: number;
    timeframe: TimeframeEnum;
    direction: DirectionEnum;
    leverage?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    currentPrice: number;
    predictedPrice: number;
    model: Models;
    closedAt?: Date | null;
};

export type UpdateTickerProcessingDto = {
    realPrice?: number;
    difference?: number;
    unrealizedDifference?: number;
    pnl?: number;
    unrealizedPnl?: number;
    isClosed?: boolean;
};

export type TickerResultsResponse = TickerProcessing & { ticker: Tickers };
