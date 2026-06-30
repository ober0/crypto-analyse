import { z } from "zod";
import { intervals } from "../../market-data/dto/get-symbol-data.dto";

export { intervals };
export type { Interval } from "../../market-data/dto/get-symbol-data.dto";

export const marketDataSchema = z.object({
    candles: z.number().min(5).max(50).describe("Какое количество свечей?"),
    interval: z.enum(intervals).describe("Какой интервал свечей")
});

export type MarketDataType = z.infer<typeof marketDataSchema>;
