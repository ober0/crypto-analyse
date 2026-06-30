export type TokenUsage = {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details: {
        cached_tokens: number
    }
};
