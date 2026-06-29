import { Injectable, Logger } from "@nestjs/common";
import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { AIMessageChunk, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Runnable, RunnableLambda } from "@langchain/core/runnables";
import { z } from "zod";
import { StructuredToolInterface } from "@langchain/core/tools";
import { ToolsService } from "./tools.service";
import { createOpenTradeGraph } from "../graphs/open-trade.graph";
import { OpenTradePrompt } from "../prompts/open-trade";
import { openTradeFormatInstructions, OpenTradeResultType } from "../response-schemas/open-trade";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { TokenUsage } from "../types/token-usage.type";
import { createCloseTradeGraph } from "../graphs/close-trade.graph";
import { closeTradeFormatInstructions, CloseTradeResultType } from "../response-schemas/close-trade";
import { CloseTradePrompt } from "../prompts/close-trade";
import { TradeResponseDto } from "../../ai-processing/types/response.dto";

@Injectable()
export class AiService {
    private logger = new Logger("AiService");

    readonly openTradeGraph: ReturnType<typeof createOpenTradeGraph>;
    readonly closeTradeGraph: ReturnType<typeof createCloseTradeGraph>;

    constructor(private readonly toolsService: ToolsService) {
        this.openTradeGraph = createOpenTradeGraph(this.toolsService);
        this.closeTradeGraph = createCloseTradeGraph(this.toolsService);
    }

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

    async openTrade({
        ticker,
        model,
        customPrompt,
        price,
        tools
    }: {
        ticker: string;
        customPrompt?: string | null;
        model: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAICallOptions>;
        price: number;
        tools?: StructuredToolInterface[];
    }): Promise<{ usage: TokenUsage; response: OpenTradeResultType; error: string | null }> {
        const inputData = `Тикер: ${ticker}, Дата: ${new Date().toISOString()}. Актуальная цена ${price}
         Пожелания пользователя ${customPrompt ?? "отсутствуют"}`;

        const response = await this.openTradeGraph.invoke(
            {
                messages: [
                    new SystemMessage(OpenTradePrompt),
                    new SystemMessage(openTradeFormatInstructions),
                    new HumanMessage(inputData)
                ]
            },
            {
                configurable: {
                    model,
                    ticker,
                    tools
                }
            }
        );

        return {
            error: response.withError ? response.error : null,
            usage: response.aiTokensUsage,
            response: response.result
        };
    }

    async processTrade({
        trade,
        ticker,
        model,
        customPrompt,
        price,
        tools
    }: {
        trade: TradeResponseDto;
        ticker: string;
        customPrompt?: string | null;
        model: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAICallOptions>;
        price: number;
        tools?: StructuredToolInterface[];
    }): Promise<{ usage: TokenUsage; response: CloseTradeResultType; error: string | null }> {
        const inputData = `Тикер: ${ticker}, Дата: ${new Date().toISOString()}. Актуальная цена ${price}
         Пожелания пользователя ${customPrompt ?? "отсутствуют"}`;

        const deal = {
            mainTimeframe: trade.mainTimeframe,
            invalidationLevel: trade.invalidationLevel,
            liquidityZone: trade.liquidityZone,
            direction: trade.direction,
            currentSize: trade.currentSize,
            averageEntryPrice: trade.averageEntryPrice,
            currentPrice: price,
            stopLoss: trade.stopLoss,
            takeProfit: trade.takeProfit,
            pnl: trade.pnl,
            actions: trade.actions.map((el) => ({
                type: el.type,
                quantity: el.quantity,
                price: el.price,
                stopLoss: el.stopLoss,
                oldStopLoss: el.oldStopLoss,
                takeProfit: el.takeProfit,
                oldTakeProfit: el.oldTakeProfit,
                comment: el.comment,
                date: el.createdAt
            }))
        };

        const dealMessage = `Текущая сделка: ${JSON.stringify(deal)}`;

        const response = await this.closeTradeGraph.invoke(
            {
                messages: [
                    new SystemMessage(CloseTradePrompt),
                    new SystemMessage(closeTradeFormatInstructions),
                    new HumanMessage(inputData),
                    new HumanMessage(dealMessage)
                ]
            },
            {
                configurable: {
                    model,
                    ticker,
                    tools
                }
            }
        );

        return {
            error: response.withError ? response.error : null,
            usage: response.aiTokensUsage,
            response: response.result
        };
    }
}
