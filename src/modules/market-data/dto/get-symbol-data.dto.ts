import { Interval } from "../../ai/tools-schemas/market-data.schema";

export class GetSymbolDataDto {
    symbol: string;
    candles: number;
    interval: Interval;
}
