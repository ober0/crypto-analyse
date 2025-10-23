import { Injectable, Logger } from "@nestjs/common";
import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { ChatCompletion } from "openai/src/resources/chat/completions/completions";

@Injectable()
export class DeepseekService {
    private readonly logger: Logger = new Logger(DeepseekService.name);

    private readonly openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY
    });

    private readonly openaiReserve = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_RESERVE_API_KEY
    });

    async sendMessageToAi<T extends object>(messages: ChatCompletionMessageParam[]): Promise<T | null> {
        this.logger.log(`Запрос в ИИ deepseek... Символов: ${JSON.stringify(messages).length}`);

        const start = Date.now();

        let response: ChatCompletion;
        try {
            response = await this.openai.chat.completions.create({
                model: "tngtech/deepseek-r1t-chimera:free",
                messages,
                response_format: { type: "json_object" },
                stream: false
            });
        } catch (err) {
            if (err.status === 429) {
                try {
                    response = await this.openaiReserve.chat.completions.create({
                        model: "tngtech/deepseek-r1t-chimera:free",
                        messages,
                        response_format: { type: "json_object" },
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

        this.logger.log(
            `Ответ от ИИ deepseek получен. Символов: ${JSON.stringify(response.choices[0].message.content).length} 
                Времени: ${processTime}`
        );

        let parsed: T;
        try {
            parsed = JSON.parse(response.choices[0].message.content!);
        } catch {
            return null;
        }

        return parsed;
    }
}
