import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { TradeDirection } from "@prisma/client";

export enum ManageBotActionEnum {
    HOLD = "HOLD",
    CLOSE = "CLOSE",
    PARTIAL_CLOSE = "PARTIAL_CLOSE",
    ADD_POSITION = "ADD_POSITION"
}

const manageSchema = z.object({
    action: z.enum(ManageBotActionEnum).describe("Действие"),

    confidence: z.number().min(0).max(1).describe("Уверенность модели в действии"),

    closePercent: z.number().min(0).max(100).nullish().describe("На сколько процентов закрыть сделку"),

    addPercent: z
        .number()
        .min(0)
        .max(100)
        .nullish()
        .describe("На сколько процентов от текущего количество докупить токен"),

    updateStopLoss: z.boolean().describe("Нужно ли изменить Stop Loss"),

    stopLoss: z.number().nullish().describe("Новое значение stopLoss, если необходимо"),

    updateTakeProfit: z.boolean().describe("Нужно ли изменить Take Profit"),

    takeProfit: z.number().nullish().describe("Новое значение takeProfit, если необходимо"),

    reasoning: z.string().describe("Почему ты  принял такое решение?")
});

export const closeTradeSchema = z.object({
    error: z.string().nullish().describe("Ошибка, если она есть. Если нет — null"),
    description: z.string().describe("Общее объяснение решения"),
    action: manageSchema
        .nullish()
        .describe("Обязательно укажи что сделать. Не указывать разрешено только, если есть ошибка")
});
export const closeTradeParser = StructuredOutputParser.fromZodSchema(closeTradeSchema);

export const closeTradeFormatInstructions = closeTradeParser.getFormatInstructions();

export type CloseTradeResultType = z.infer<typeof closeTradeSchema>;
