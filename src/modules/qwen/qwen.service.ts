import { Injectable, Logger } from "@nestjs/common";
import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

@Injectable()
export class QwenService {
    private readonly logger: Logger = new Logger(QwenService.name);

    private readonly openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY
    });

    private readonly openaiReserve = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_RESERVE_API_KEY
    });

    async sendMessageToAi<T extends object>(messages: ChatCompletionMessageParam[]): Promise<T | null> {
        this.logger.log(`Запрос в ИИ qwen... Символов: ${JSON.stringify(messages).length}`);

        const start = Date.now();

        let response;
        try {
            response = await this.openai.chat.completions.create({
                model: "qwen/qwen3-30b-a3b:free",
                messages,
                response_format: { type: "json_object" },
                stream: false
            });
        } catch (err) {
            if (err.status === 429) {
                try {
                    response = await this.openaiReserve.chat.completions.create({
                        model: "qwen/qwen3-30b-a3b:free",
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

        let parsed: T;
        try {
            this.logger.log(
                `Ответ от ИИ qwen получен. Символов: ${JSON.stringify(response.choices[0].message.content).length} 
                Времени: ${processTime}`
            );

            parsed = JSON.parse(response.choices[0].message.content!);
        } catch (err) {
            this.logger.error(
                `Ответ от ИИ qwen получен с ошибкой: ${err.message}
                Времени: ${processTime}`
            );

            return null;
        }

        return parsed;
    }
}
