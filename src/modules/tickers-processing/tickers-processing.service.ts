import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TickersService } from "../tickers/tickers.service";
import { Models, TimeframeEnum } from "@prisma/client";
import { TickerResponseDto } from "../tickers/dto/response.dto";
import { ChatCompletionMessageParam } from "openai/resources";
import { getTickerAnalysisPrompt, getTickerAnalysisSchema } from "./cfg/prompt";
import { ChatgptService } from "../chatgpt/chatgpt.service";
import { MarketData } from "./types/market-data";
import { MarketDataService } from "../market-data/market-data.service";
import { TickerAnalysis } from "./types/ai-response";
import { TickerResultsService } from "../ticker-results/ticker-results.service";
import { CreateTickerProcessingDto } from "../ticker-results/types";
import { IndicatorsResponse } from "../custom-indicators/dto/index.dto";
import { CustomIndicatorsService } from "../custom-indicators/custom-indicators.service";
import { DeepseekService } from "../deepseek/deepseek.service";
import { QwenService } from "../qwen/qwen.service";

@Injectable()
export class TickersProcessingService {
    private readonly logger: Logger = new Logger("TickersProcessingService");
    constructor(
        private readonly tickerService: TickersService,
        private readonly chatgptService: ChatgptService,
        private readonly marketDataService: MarketDataService,
        private readonly tickerResultsService: TickerResultsService,
        private readonly indicatorsService: CustomIndicatorsService,
        private readonly deepseekService: DeepseekService,
        private readonly qwenService: QwenService
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

        const prompt: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: JSON.stringify({
                    prompt: getTickerAnalysisPrompt(currentPrice),
                    schema: getTickerAnalysisSchema(currentPrice)
                })
            },
            {
                role: "user",
                content: userContent
            }
        ];

        const sendDataToAi = async (
            service: typeof this.chatgptService | typeof this.deepseekService | typeof this.qwenService
        ) => {
            try {
                const aiResponse: TickerAnalysis | null = await service.sendMessageToAi<TickerAnalysis>(prompt);
                if (!aiResponse) {
                    throw new Error("No ai response");
                }

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
                        model:
                            service === this.chatgptService
                                ? Models.Gpt5
                                : service === this.deepseekService
                                  ? Models.DeepseekR1T
                                  : Models.Qwen3
                    };

                    await this.tickerResultsService.create(saveData);
                };

                await save("oneDay");
                await save("oneWeek");
            } catch (err) {
                this.logger.error(err.message);
                throw err;
            }
        };

        const services = [this.chatgptService, this.deepseekService, this.qwenService];
        const promises = services.map((service) => sendDataToAi(service));

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
