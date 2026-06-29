import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { TradeDirection } from "@prisma/client";

export const tradeSchema = z.object({
    symbol: z.string().describe("Тикер, например BTCUSDT"),
    direction: z.enum(TradeDirection).describe("Направление сделки"),
    stopLoss: z.number().describe("Стоп-лосс"),
    takeProfit: z.number().describe("Тейк профит"),
    size: z.number().max(5).min(0.00001).describe("Сколько единиц купить?"),
    confidence: z.number().min(0).max(1).describe("Уверенность модели от 0 до 1"),
    timeframe: z.string().describe("Основной таймфрейм сделки (например 15m, 1h)"),
    reasoning: z.string().describe("Краткое обоснование структуры сделки"),
    invalidationLevel: z.number().describe("Уровень, при пробое которого сценарий становится невалидным"),
    liquidityZone: z.string().nullish().describe("Описание зоны ликвидности, если применимо")
});

export const tradeSchemaParser = StructuredOutputParser.fromZodSchema(tradeSchema);

export const openTradeSchema = z.object({
    error: z.string().nullish().describe("Ошибка, если она есть. Если нет — null"),
    isTradeOpen: z.boolean().describe("Открывать ли сделку"),
    description: z.string().describe("Общее объяснение решения (почему вход есть или его нет)"),
    trade: tradeSchema.nullish().describe("Детали сделки, если isTradeOpen = true")
});
export const openTradeParser = StructuredOutputParser.fromZodSchema(openTradeSchema);

export const openTradeFormatInstructions = openTradeParser.getFormatInstructions();

export type OpenTradeResultType = z.infer<typeof openTradeSchema>;
