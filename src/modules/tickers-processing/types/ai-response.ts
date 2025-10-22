import { DirectionEnum } from "@prisma/client";

export type TickerAnalysis = {
    direction: DirectionEnum;
    leverage?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    predictedPrice: number;
};
