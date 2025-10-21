import { DirectionEnum, TimeframeEnum } from "@prisma/client";

export function getTickerAnalysisSchema(interval: TimeframeEnum) {
    return {
        type: "object",
        properties: {
            direction: {
                type: "string",
                enum: Object.values(DirectionEnum),
                description: `Направление позиции на ближайшие ${interval === TimeframeEnum.OneDay ? "один день" : "одну неделю"}. Возможные значения: ${Object.values(DirectionEnum).join(", ")}`
            },
            leverage: {
                type: "number",
                nullable: true,
                min: 1,
                max: 5,
                description: `Какое плечо использовать, сопостовимо риску? 1-5 на ближайшие ${interval === TimeframeEnum.OneDay ? "один день" : "одну неделю"}.`
            },
            stopLoss: {
                type: "number",
                nullable: true,
                description: "Уровень стоп-лосса для позиции. Если отсутствует, null."
            },
            takeProfit: {
                type: "number",
                nullable: true,
                description: "Уровень тейк-профита для позиции. Если отсутствует, null."
            },
            predictedPrice: {
                type: "number",
                description:
                    'Прогнозируемая цена закрытия позиции, рассчитанная моделью. на ближайшие ${interval === TimeframeEnum.OneDay ? "один день" : "одну неделю"'
            }
        },
        required: ["direction", "predictedPrice"]
    };
}

export function getTickerAnalysisPrompt(interval: TimeframeEnum) {
    const currentDate = new Date().toISOString();

    return `Ты — эксперт по криптоторговле и алгоритмическому прогнозированию. Перед использованием этого промпта вызывающая среда подставляет следующие значения:
• TIMEFRAME: ${interval}
• CURRENT_DATE_ISO: ${currentDate}
• JSON_SCHEMA: будет передан отдельно (модель должна строго соответствовать этой схеме).

ТРЕБОВАНИЯ:
1. Верни только **валидный JSON**, строго по JSON Schema.
2. Никакого текста вне JSON, никаких заголовков или комментариев.
3. Используй данные тикера для анализа позиции: направление, левередж, стоп-лосс, тейк-профит, прогнозируемая цена, статус закрытия и таймфрейм.
4. Объясняй значения внутри JSON через описание полей, не добавляй лишнюю информацию вне схемы.`;
}
