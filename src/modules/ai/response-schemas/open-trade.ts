import { z } from "zod";
import { DirectionEnum } from "@prisma/client";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

export const openTradeSchema = z.object({
    error: z.string().nullish().describe("Ошибка, если она есть. Если нету - не указывыай ничего (null)")
});

export const openTradeParser = StructuredOutputParser.fromZodSchema(openTradeSchema);

export const openTradeFormatInstructions = openTradeParser.getFormatInstructions();

export type OpenTradeResultType = z.infer<typeof openTradeSchema>;
