import { DirectionEnum, TickerProcessing, Tickers, TimeframeEnum } from "@prisma/client";

export type CreateTickerProcessingDto = {
    tickerId: number;
    timeframe: TimeframeEnum;
    direction: DirectionEnum;
    leverage?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    currentPrice: number;
    predictedPrice: number;
    closedAt?: Date | null;
};

export type UpdateTickerProcessingDto = {
    realPrice?: number | null;
    difference?: number | null;
    leverageDifference?: number | null;
    percentDifference?: number | null;
    isClosed?: boolean;
};

export type TickerResultsResponse = TickerProcessing & { ticker: Tickers };
