import { Injectable, Logger } from "@nestjs/common";
import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

@Injectable()
export class ChatgptService {
    private readonly logger: Logger = new Logger(ChatgptService.name);

    private readonly openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    async sendMessageToAi<T extends object>(messages: ChatCompletionMessageParam[]): Promise<T | null> {
        this.logger.log(`Запрос в ИИ... Символов: ${JSON.stringify(messages).length}`);

        const start = Date.now();

        let response;
        try {
            response = await this.openai.chat.completions.create({
                model: "gpt-5-nano",
                messages,
                temperature: 0,
                response_format: { type: "json_object" },
                stream: false
            });
        } catch {
            return null;
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
            `Ответ от ИИ получен. Символов: ${JSON.stringify(response.choices[0].message.content).length} 
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
