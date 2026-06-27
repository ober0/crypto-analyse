import { ChatOpenAI } from "@langchain/openai";
import { Models } from "@prisma/client";

const openRouterConfig = {
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: { baseURL: "https://openrouter.ai/api/v1" }
};

export const openAiChat = new ChatOpenAI({
    ...openRouterConfig,
    model: "openai/gpt-5"
});

export const llamaChat = new ChatOpenAI({
    ...openRouterConfig,
    model: "meta-llama/llama-4-maverick"
});

export const deepseekChat = new ChatOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: { baseURL: "https://api.deepseek.com" },
    model: "deepseek-v4-flash"
});

export const OpenAiToModelsMap = new Map<Models, ChatOpenAI>([
    [Models.Gpt5, openAiChat],
    [Models.Deepseek4Flash, deepseekChat],
    [Models.Llama4, llamaChat]
]);
