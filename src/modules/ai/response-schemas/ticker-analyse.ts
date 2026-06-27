import { z } from "zod";
import { DirectionEnum } from "@prisma/client";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

export const tickerAnalyseSchema = z.object({
    oneWeek: z
        .object({
            direction: z.enum(DirectionEnum).describe("Направление позиции на ближайшую одну неделю"),
            leverage: z
                .int()
                .max(5)
                .min(1)
                .default(1)
                .describe(
                    "Какое плечо использовать, сопостовимо риску? 1-5 на ближайшую одну неделю. Только целое число"
                ),
            stopLoss: z
                .number()
                .nullish()
                .describe("Уровень стоп-лосса для позиции. Не обязательное поле. Учти, что прогноз на одну неделю"),
            takeProfit: z
                .number()
                .nullish()
                .describe("Уровень тейк-профита для позиции. Не обязательное поле.  Учти, что прогноз на одну неделю"),
            predictedPrice: z
                .number()
                .describe("Прогнозируемая цена закрытия позиции, рассчитанная моделью. на ближайшую одну неделю")
        })
        .describe("анализ на неделю вперед"),
    oneDay: z
        .object({
            direction: z.enum(DirectionEnum).describe("Направление позиции на ближайший день"),
            leverage: z
                .int()
                .max(5)
                .min(1)
                .default(1)
                .describe(
                    "Какое плечо использовать, сопоставимо риску? 1-5 на ближайшую одну неделю. Только целое число"
                ),
            stopLoss: z
                .number()
                .nullish()
                .describe("Уровень стоп-лосса для позиции. Не обязательное поле. Учти, что прогноз на один день"),
            takeProfit: z
                .number()
                .nullish()
                .describe("Уровень тейк-профита для позиции. Не обязательное поле.  Учти, что прогноз на один день"),
            predictedPrice: z
                .number()
                .describe("Прогнозируемая цена закрытия позиции, рассчитанная моделью, на один день")
        })
        .describe("анализ на 1 день вперед")
});

export const tickerAnalyseParser = StructuredOutputParser.fromZodSchema(tickerAnalyseSchema);

export const tickerAnalyseFormatInstructions = tickerAnalyseParser.getFormatInstructions();
