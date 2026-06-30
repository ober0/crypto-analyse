import { ChatOpenAI } from "@langchain/openai";
import { Models } from "@prisma/client";

const openRouterConfig = {
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: { baseURL: "https://openrouter.ai/api/v1" }
};

const polzaAiConfig = {
    apiKey: process.env.POLZA_AI_API_KEY,
    configuration: { baseURL: "https://polza.ai/api/v1" }
};

export const openAiChat = new ChatOpenAI({
    ...polzaAiConfig,
    model: "openai/gpt-5-nano"
});

export const llamaChat = new ChatOpenAI({
    ...polzaAiConfig,
    model: "meta-llama/llama-4-scout"
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
