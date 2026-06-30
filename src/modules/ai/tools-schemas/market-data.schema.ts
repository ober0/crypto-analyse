import { z } from "zod";

export const intervals = ["1", "15", "60", "D", "W"] as const;

export const marketDataSchema = z.object({
    candles: z.number().min(5).max(50).describe("Какое количество свечей?"),
    interval: z.enum(intervals).describe("Какой интервал свечей")
});

export type Interval = (typeof intervals)[number];
export type MarketDataType = z.infer<typeof marketDataSchema>;
