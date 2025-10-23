import { DirectionEnum } from "@prisma/client";

type AnalyseData = {
    direction: DirectionEnum;
    leverage?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    predictedPrice: number;
};

export type TickerAnalysis = {
    oneDay: AnalyseData;
    oneWeek: AnalyseData;
};
