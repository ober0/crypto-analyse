import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { TickersService } from "../tickers/tickers.service";
import { Models, TimeframeEnum } from "@prisma/client";
import { TickerResponseDto } from "../tickers/dto/response.dto";
import { MarketData } from "./types/market-data";
import { MarketDataService } from "../market-data/market-data.service";
import { TickerResultsService } from "../ticker-results/ticker-results.service";
import { CreateTickerProcessingDto } from "../ticker-results/types";
import { IndicatorsResponse } from "../custom-indicators/dto/index.dto";
import { CustomIndicatorsService } from "../custom-indicators/custom-indicators.service";
import { OpenAiToModelsMap } from "../ai/models/models";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getTickerAnalysisPrompt } from "../ai/prompts/ticker-analyse";
import { tickerAnalyseFormatInstructions, tickerAnalyseParser } from "../ai/response-schemas/ticker-analyse";
import { AiService } from "../ai/services/ai.service";

@Injectable()
export class TickersProcessingService {
    private readonly logger: Logger = new Logger("TickersProcessingService");
    constructor(
        private readonly tickerService: TickersService,
        private readonly marketDataService: MarketDataService,
        private readonly tickerResultsService: TickerResultsService,
        private readonly indicatorsService: CustomIndicatorsService,
        private readonly aiService: AiService
    ) {}

    // async onModuleInit() {
    //     await this.cron();
    // }

    @Cron("0 0 * * *", {
        timeZone: "Europe/Moscow"
    })
    async cron() {
        const symbols = await this.tickerService.getAll();

        for (const symbol of symbols) {
            await this.analyseSymbol(symbol);
        }
    }

    private async analyseSymbol(symbol: TickerResponseDto) {
        let marketData: MarketData;
        let indicators: IndicatorsResponse[];

        try {
            marketData = await this.getMarketData(symbol.name);

            indicators = await Promise.all([
                this.indicatorsService.getIndicators({
                    symbol: symbol.name,
                    interval: "D",
                    candles: 20
                }),
                this.indicatorsService.getIndicators({
                    symbol: symbol.name,
                    interval: "W",
                    candles: 20
                })
            ]);
        } catch (err) {
            console.error(err);
            throw err;
        }

        const userContent = `Исторические данные: ${JSON.stringify(marketData)} Индикаторы: ${JSON.stringify(indicators)}. Так же самостоятельно расчитай и другие индикаторы, которые тебе необходимы для полноценного анализа. В ответе их отдавать не нужно`;

        const currentPrice =
            marketData.fifteenMinutes?.at(0)?.close ??
            marketData.oneHour?.at(0)?.close ??
            marketData.oneDay?.at(0)?.close ??
            marketData.oneWeek?.at(0)?.close ??
            0;

        if (currentPrice === 0) {
            throw new Error("No currentPrice");
        }

        const prompt: BaseMessage[] = [
            new SystemMessage(JSON.stringify(getTickerAnalysisPrompt(currentPrice))),
            new SystemMessage(tickerAnalyseFormatInstructions),
            new HumanMessage(userContent)
        ];

        const sendDataToAi = async (model: Models) => {
            try {
                const modelOpenAi = OpenAiToModelsMap.get(model);

                if (!modelOpenAi) {
                    return;
                }

                const response = await this.aiService.request(prompt, modelOpenAi, tickerAnalyseParser);

                const aiResponse = response.data;

                const save = async (timeframe: "oneDay" | "oneWeek") => {
                    const closedAt = new Date(
                        Date.now() + (timeframe === "oneDay" ? 1000 * 60 * 60 * 24 : 1000 * 60 * 60 * 24 * 7)
                    );

                    if (!aiResponse[timeframe].direction || aiResponse[timeframe].direction === "Nothing") {
                        return;
                    }

                    const saveData: CreateTickerProcessingDto = {
                        stopLoss: aiResponse[timeframe].stopLoss,
                        takeProfit: aiResponse[timeframe].takeProfit,
                        leverage: aiResponse[timeframe].leverage,
                        timeframe: timeframe === "oneWeek" ? TimeframeEnum.OneWeek : TimeframeEnum.OneDay,
                        predictedPrice: aiResponse[timeframe].predictedPrice,
                        currentPrice,
                        tickerId: symbol.id,
                        direction: aiResponse[timeframe].direction,
                        closedAt,
                        model,
                        usage: response.metadata.tokenUsage
                    };

                    await this.tickerResultsService.create(saveData);
                };

                await Promise.all([save("oneDay"), save("oneWeek")]);
            } catch (err) {
                this.logger.error(err.message);
                throw err;
            }
        };

        const models = Object.values(Models);
        const promises = models.map((model) => sendDataToAi(model));

        await Promise.allSettled(promises);
    }

    private async getMarketData(symbol: string) {
        const [fifteenMinutes, oneHour, oneDay, oneWeek] = await Promise.all([
            this.marketDataService.getSymbolData({
                symbol,
                candles: 15,
                interval: "15"
            }),
            this.marketDataService.getSymbolData({
                symbol,
                candles: 20,
                interval: "60"
            }),
            this.marketDataService.getSymbolData({
                symbol,
                candles: 20,
                interval: "D"
            }),
            this.marketDataService.getSymbolData({
                symbol,
                candles: 15,
                interval: "W"
            })
        ]);

        return {
            fifteenMinutes,
            oneHour,
            oneDay,
            oneWeek
        };
    }
}
