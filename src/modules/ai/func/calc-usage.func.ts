import { AIMessage, UsageMetadata } from "@langchain/core/messages";
import { TokenUsage } from "../types/token-usage.type";

export function fromUsageMetadata(meta?: UsageMetadata | null): TokenUsage | undefined {
    if (meta == null) {
        return undefined;
    }
    if (meta.input_tokens === undefined && meta.output_tokens === undefined && meta.total_tokens === undefined) {
        return undefined;
    }
    return {
        prompt_tokens: meta.input_tokens ?? 0,
        completion_tokens: meta.output_tokens ?? 0,
        total_tokens: meta.total_tokens ?? (meta.input_tokens ?? 0) + (meta.output_tokens ?? 0),
        prompt_tokens_details: {
            cached_tokens: meta.input_token_details?.cache_read ?? 0
        }
    };
}

function fromResponseTokenUsage(raw: unknown): TokenUsage | undefined {
    if (!raw || typeof raw !== "object") {
        return undefined;
    }
    const u = raw as Record<string, unknown>;
    const prompt = (u.prompt_tokens ?? u.promptTokens) as number | undefined;
    const completion = (u.completion_tokens ?? u.completionTokens) as number | undefined;
    const total = (u.total_tokens ?? u.totalTokens) as number | undefined;
    if (prompt === undefined && completion === undefined && total === undefined) {
        return undefined;
    }
    const details = u.prompt_tokens_details as { cached_tokens?: number } | undefined;
    return {
        prompt_tokens: prompt ?? 0,
        completion_tokens: completion ?? 0,
        total_tokens: total ?? (prompt ?? 0) + (completion ?? 0),
        prompt_tokens_details: {
            cached_tokens: details?.cached_tokens ?? 0
        }
    };
}

export function extractTokenUsageFromMessage(message: AIMessage): TokenUsage | undefined {
    const fromMeta = fromUsageMetadata(message.usage_metadata);
    if (fromMeta) {
        return fromMeta;
    }

    const meta = message.response_metadata;
    if (!meta) {
        return undefined;
    }

    const nested = (meta as { usage?: unknown }).usage;
    const fromNested = fromResponseTokenUsage(nested);
    if (fromNested) {
        return fromNested;
    }

    return fromResponseTokenUsage((meta as { token_usage?: unknown }).token_usage);
}
