import { z } from "zod";

export const webSearchSchema = z.object({
    query: z.string().describe("Что найти?"),
    numResults: z.number().max(20).min(1).optional().describe("Количество результатов (до 20)"),
    daysAgo: z
        .number()
        .max(15)
        .describe("количество дней до сегодняшней даты, за которую будет получен результат поиска")
});

export type ExaSearchType = z.infer<typeof webSearchSchema>;
