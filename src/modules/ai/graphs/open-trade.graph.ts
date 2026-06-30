import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { END, START, StateGraph } from "@langchain/langgraph";
import { TokenUsage } from "../types/token-usage.type";
import { openTradeParser, OpenTradeResultType } from "../response-schemas/open-trade";
import { ToolsService } from "../services/tools.service";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { extractTokenUsageFromMessage } from "../func/calc-usage.func";
import { AIMessageChunk, isAIMessage, ToolCall } from "@langchain/core/messages";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { Runnable } from "@langchain/core/runnables";
import { StructuredToolInterface } from "@langchain/core/tools";
import { Logger } from "@nestjs/common";

const logger = new Logger("OpenTradeGraph");

function getValidToolCalls(toolCalls?: ToolCall[]) {
    return (toolCalls ?? []).filter((call) => call?.name);
}

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
    const defaultTools = [
        toolsService.webSearchTool,
        toolsService.marketDataTool,
        toolsService.indicatorsTool
    ];

    return new StateGraph(OpenTradeGraphState)
        .addNode("tools", async (state, config) => {
            const tools = (config.configurable?.tools as StructuredToolInterface[]) ?? defaultTools;
            const toolNode = new ToolNode(tools, { handleToolErrors: true });

            return toolNode.invoke(state, config);
        })
        .addNode("llm", async (state, config) => {
            const model = config.configurable?.model as Runnable<
                BaseLanguageModelInput,
                AIMessageChunk,
                ChatOpenAICallOptions
            >;

            const response = await model.invoke([...state.messages]);
            const validToolCalls = getValidToolCalls(response.tool_calls);

            if (validToolCalls.length !== (response.tool_calls?.length ?? 0)) {
                response.tool_calls = validToolCalls;
            }

            const nodeResult: typeof OpenTradeGraphState.Update = {
                messages: [response],
                aiTokensUsage: extractTokenUsageFromMessage(response)
            };

            if (!validToolCalls.length) {
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
                    logger.error(`[ValidateError]: ${error}`);
                    nodeResult.error = "ValidateError";
                    nodeResult.withError = true;
                }
            }

            return nodeResult;
        })
        .addEdge(START, "llm")
        .addConditionalEdges("llm", (state) => {
            const last = state.messages.at(-1);
            const validToolCalls = last && isAIMessage(last) ? getValidToolCalls(last.tool_calls) : [];

            if (state.error === "ValidateError") {
                return "llm";
            }

            return validToolCalls.length ? "tools" : END;
        })
        .addEdge("tools", "llm")
        .compile();
}
