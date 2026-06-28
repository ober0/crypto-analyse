import { z } from "zod";
import { intervals } from "./market-data.schema";

export const indicatorsSchema = z.object({
    candles: z.number().min(5).max(50).describe("Какое количество свечей для расчетов?"),
    interval: z.enum(intervals).describe("Какой интервал свечей")
});

export type IndicatorsType = z.infer<typeof indicatorsSchema>;
