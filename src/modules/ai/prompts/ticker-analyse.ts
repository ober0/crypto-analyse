export function getTickerAnalysisPrompt(priceNow: number) {
    const currentDate = new Date().toISOString();

    return `Ты — эксперт по криптоторговле и алгоритмическому прогнозированию.
        Перед использованием этого промпта вызывающая среда подставляет следующие значения:
        • ЦЕНА СЕЙЧАС: ${priceNow}
        • CURRENT_DATE_ISO: ${currentDate}
        • JSON_SCHEMA: будет передан отдельно`;
}
