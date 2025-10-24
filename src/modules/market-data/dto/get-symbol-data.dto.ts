import { TimeframeEnum } from "@prisma/client";

export class GetSymbolDataDto {
    symbol: string;
    candles: number;
    interval: "1" | "15" | "60" | "D" | "W";
}
