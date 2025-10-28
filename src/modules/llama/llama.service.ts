import { Injectable, Logger } from "@nestjs/common";
import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

@Injectable()
export class LlamaService {
    private readonly logger: Logger = new Logger(LlamaService.name);

    private readonly openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY
    });

    private readonly openaiReserve = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_RESERVE_API_KEY
    });

    async sendMessageToAi<T extends object>(messages: ChatCompletionMessageParam[]): Promise<T | null> {
        this.logger.log(`Запрос в ИИ llama4... Символов: ${JSON.stringify(messages).length}`);

        const start = Date.now();

        let response;
        try {
            response = await this.openai.chat.completions.create({
                model: "meta-llama/llama-4-maverick:free",
                messages,
                stream: false
            });
        } catch (err) {
            if (err.status === 429) {
                try {
                    response = await this.openaiReserve.chat.completions.create({
                        model: "meta-llama/llama-4-maverick:free",
                        messages,
                        stream: false
                    });
                } catch (err) {
                    console.error(err);
                    return null;
                }
            } else {
                console.error(err);
                return null;
            }
        }

        const diff = Date.now() - start;
        const totalSeconds = Math.floor(diff / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const processTime: string =
            hours > 0
                ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:
                    ${seconds.toString().padStart(2, "0")}`
                : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        let parsed: T;
        try {
            this.logger.log(
                `Ответ от ИИ llama4 получен. Символов: ${JSON.stringify(response.choices[0].message.content).length} 
                Времени: ${processTime}`
            );

            parsed = await this.formatToJsonSchema(response.choices[0].message.content!);
        } catch (err) {
            this.logger.error(
                `Ответ от ИИ llama4 получен с ошибкой: ${err.message}
                Времени: ${processTime}`
            );

            return null;
        }

        return parsed;
    }

    private async formatToJsonSchema(rawResponse: string) {
        const cleanedResponse = rawResponse.trim();
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/m);
        let jsonStr = jsonMatch ? jsonMatch[1].trim() : cleanedResponse;

        if (!jsonMatch) {
            if (
                !(jsonStr.startsWith("{") && jsonStr.endsWith("}")) &&
                !(jsonStr.startsWith("[") && jsonStr.endsWith("]"))
            ) {
                jsonStr = jsonStr.replace(/"/g, '\\"');
            }
        }

        try {
            jsonStr = jsonStr.replace(/(\d+),(\d+)/g, "$1$2");
            const parsedJson = JSON.parse(jsonStr);
            return JSON.parse(JSON.stringify(parsedJson, null, 2));
        } catch (e: any) {
            if (e instanceof SyntaxError) {
                this.logger.error(
                    JSON.stringify({ error: "Невалидный JSON", raw_response: rawResponse, details: e.message }, null, 2)
                );
            }
            this.logger.error(JSON.stringify({ error: "Ошибка обработки", details: e.message || String(e) }, null, 2));
        }
    }
}
