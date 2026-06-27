import { Injectable, Logger } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda } from "@langchain/core/runnables";
import { z } from "zod";

@Injectable()
export class AiService {
    private logger = new Logger("AiService");

    private parseNode = <T extends z.ZodObject>(parser: StructuredOutputParser<T>) =>
        new RunnableLambda({
            func: async (message: BaseMessage) => {
                if (message.content === "" || ("tool_calls" in message && (message.tool_calls as any).length !== 0)) {
                    throw new Error("empty content");
                }

                const parsed = await parser.parse(message.text);

                return {
                    data: parsed,
                    metadata: message.response_metadata as any,
                    raw: message
                };
            }
        });

    async request<T extends z.ZodObject>(
        messages: BaseMessage[],
        model: ChatOpenAI,
        parser: StructuredOutputParser<T>
    ) {
        this.logger.log(`AI request ${model.model} chars=${JSON.stringify(messages.map((m) => m.content)).length}`);

        const start = new Date().getDate();

        const response = await model.pipe(this.parseNode(parser)).invoke(messages);

        const end = new Date().getDate() - start;

        this.logger.log(
            `AI request end. \n time: ${end} ms \n model: ${model.model} \n usage: ${JSON.stringify(response.metadata.tokenUsage, null, 2)} `
        );

        return response;
    }
}
