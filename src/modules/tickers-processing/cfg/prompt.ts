import { DirectionEnum, TimeframeEnum } from "@prisma/client";

export function getTickerAnalysisSchema(priceNow: number) {
    return {
        type: "object",
        required: ["oneWeek", "oneDay"],
        properties: {
            oneWeek: {
                type: "object",
                required: ["direction", "predictedPrice", "leverage"],
                description: "анализ на неделю вперед",
                properties: {
                    direction: {
                        type: "string",
                        enum: Object.values(DirectionEnum),
                        description: `Направление позиции на ближайшую одну неделю. Возможные значения: ${Object.values(DirectionEnum).join(", ")}`
                    },
                    leverage: {
                        type: "number",
                        nullable: false,
                        min: 1,
                        max: 5,
                        default: 1,
                        description: `Какое плечо использовать, сопостовимо риску? 1-5 на ближайшую одну неделю.`
                    },
                    stopLoss: {
                        type: "number",
                        nullable: true,
                        description: `Уровень стоп-лосса для позиции. Если отсутствует, null. Учти, что цена сейчас - ${priceNow}, а прогноз на одну неделю`
                    },
                    takeProfit: {
                        type: "number",
                        nullable: true,
                        description: `Уровень тейк-профита для позиции. Если отсутствует, null.  Учти, что цена сейчас - ${priceNow}, а прогноз на одну неделю`
                    },
                    predictedPrice: {
                        type: "number",
                        description: `Прогнозируемая цена закрытия позиции, рассчитанная моделью. на ближайшую одну неделю  Учти, что цена сейчас - ${priceNow}`
                    }
                }
            },
            oneDay: {
                type: "object",
                required: ["direction", "predictedPrice", "leverage"],
                description: "анализ на день вперед",
                properties: {
                    direction: {
                        type: "string",
                        enum: Object.values(DirectionEnum),
                        description: `Направление позиции на ближайшие сутки (24ч). Возможные значения: ${Object.values(DirectionEnum).join(", ")}`
                    },
                    leverage: {
                        type: "number",
                        nullable: false,
                        min: 1,
                        max: 5,
                        default: 1,
                        description: `Какое плечо использовать, сопостовимо риску? 1-5 на ближайшие сутки (24ч)`
                    },
                    stopLoss: {
                        type: "number",
                        nullable: true,
                        description: `Уровень стоп-лосса для позиции. Если отсутствует, null. Учти, что цена сейчас - ${priceNow}, а прогноз на ближайшие сутки (24ч)`
                    },
                    takeProfit: {
                        type: "number",
                        nullable: true,
                        description: `Уровень тейк-профита для позиции. Если отсутствует, null.  Учти, что цена сейчас - ${priceNow}, а прогноз на ближайшие сутки (24ч)`
                    },
                    predictedPrice: {
                        type: "number",
                        description: `Прогнозируемая цена закрытия позиции, рассчитанная моделью. на ближайшие сутки (24ч).  Учти, что цена сейчас - ${priceNow}`
                    }
                }
            }
        }
    };
}

export function getTickerAnalysisPrompt(priceNow: number) {
    const currentDate = new Date().toISOString();

    return `Ты — эксперт по криптоторговле и алгоритмическому прогнозированию. Перед использованием этого промпта вызывающая среда подставляет следующие значения:
• ЦЕНА СЕЙЧАС: ${priceNow}
• CURRENT_DATE_ISO: ${currentDate}
• JSON_SCHEMA: будет передан отдельно (модель должна строго соответствовать этой схеме).

ТРЕБОВАНИЯ:
1. Верни только **валидный JSON**, строго по JSON Schema.
2. Никакого текста вне JSON, никаких заголовков или комментариев.
3. Используй данные тикера для анализа позиции: направление, левередж, стоп-лосс, тейк-профит, прогнозируемая цена, статус закрытия и таймфрейм.
4. Объясняй значения внутри JSON через описание полей, не добавляй лишнюю информацию вне схемы.`;
}
