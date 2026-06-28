import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { END, START, StateGraph } from "@langchain/langgraph";
import { TokenUsage } from "../types/token-usage.type";
import { openTradeFormatInstructions, openTradeParser, OpenTradeResultType } from "../response-schemas/open-trade";
import { ToolsService } from "../services/tools.service";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { extractTokenUsageFromMessage } from "../func/calc-usage.func";
import { AIMessageChunk } from "@langchain/core/messages";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { Runnable } from "@langchain/core/runnables";

export const OpenTradeGraphState = Annotation.Root({
    ...MessagesAnnotation.spec,
    withError: Annotation<boolean>({
        reducer: (_, next) => next,
        default: () => false
    }),
    aiTokensUsage: Annotation<TokenUsage>({
        reducer: (prev, next) => ({
            prompt_tokens: prev.prompt_tokens + next.prompt_tokens,
            completion_tokens: prev.completion_tokens + next.completion_tokens,
            total_tokens: prev.total_tokens + next.total_tokens,
            prompt_tokens_details: {
                cached_tokens: prev.prompt_tokens_details.cached_tokens + next.prompt_tokens_details.cached_tokens
            }
        }),
        default: () => ({
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            prompt_tokens_details: {
                cached_tokens: 0
            }
        })
    }),
    error: Annotation<string | "ValidateError">({
        reducer: (_, next) => next
    }),
    result: Annotation<OpenTradeResultType>({
        reducer: (_, next) => next
    })
});

export function createOpenTradeGraph(toolsService: ToolsService) {
    const toolNode = new ToolNode([
        toolsService.webSearchTool,
        toolsService.marketDataTool,
        toolsService.indicatorsTool
    ]);

    return new StateGraph(OpenTradeGraphState)
        .addNode("tools", toolNode)
        .addNode("llm", async (state, config) => {
            const model = config.configurable?.model as Runnable<
                BaseLanguageModelInput,
                AIMessageChunk,
                ChatOpenAICallOptions
            >;

            const response = await model.invoke([...state.messages]);

            const nodeResult: typeof OpenTradeGraphState.Update = {
                messages: [response],
                aiTokensUsage: extractTokenUsageFromMessage(response)
            };

            if (response.tool_calls?.length === 0) {
                try {
                    const validateResponse = await openTradeParser.parse(response.text);

                    const error = validateResponse.error;

                    if (error) {
                        nodeResult.error = error;
                        nodeResult.withError = true;
                    } else {
                        nodeResult.withError = false;
                        nodeResult.result = validateResponse;
                    }
                } catch (error) {
                    this.logger.error(`[ValidateError]: ${error}`);
                    nodeResult.error = "ValidateError";
                    nodeResult.withError = true;
                }
            }

            return nodeResult;
        })

        .addEdge(START, "llm")
        .addConditionalEdges("llm", (state) => {
            const last = state.messages.at(-1);

            if (state.error === "ValidateError") {
                return "llm";
            }

            // @ts-ignore
            return last?.tool_calls?.length ? "tools" : END;
        })
        .compile();
}
