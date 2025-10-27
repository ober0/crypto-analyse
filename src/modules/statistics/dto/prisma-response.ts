import { Models, TimeframeEnum } from "@prisma/client";

export class PrismaResponse {
    _avg: {
        pnl: number | null;
        unrealizedPnl: number | null;
        leverage: number | null;
        difference: number | null;
        unrealizedDifference: number | null;
    };
    _count: {
        _all: number | null;
    };
    _sum: {
        difference: number | null;
        unrealizedDifference: number | null;
    };
    model?: Models;
    timeframe?: TimeframeEnum;
    tickersId?: number;
}
