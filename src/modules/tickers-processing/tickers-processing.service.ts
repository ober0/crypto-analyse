import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TickersService } from "../tickers/tickers.service";
import { Models, Prisma, TimeframeEnum } from "@prisma/client";
import { TickerResponseDto } from "../tickers/dto/response.dto";
import { ChatCompletionMessageParam } from "openai/resources";
import { getTickerAnalysisPrompt, getTickerAnalysisSchema } from "./cfg/prompt";
import { ChatgptService } from "../chatgpt/chatgpt.service";
import { MarketData } from "./types/market-data";
import { SymbolDataResponseDto } from "../market-data/dto/response.dto";
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

    @Cron(CronExpression.EVERY_DAY_AT_NOON)
    async cron() {
        const symbols = await this.tickerService.getAll();

        for (const symbol of symbols) {
            const results = await Promise.allSettled([
                this.analyseSymbol(symbol, TimeframeEnum.OneDay),
                this.analyseSymbol(symbol, TimeframeEnum.OneWeek)
            ]);
            this.logger.log(
                `Символ ${symbol.name} проанализирован (успешно: ${
                    results.filter((el) => el.status === "fulfilled").length
                }/${results.length})`
            );
        }
    }

    private async analyseSymbol(symbol: TickerResponseDto, timeframe: TimeframeEnum) {
        let marketData: MarketData;
        let indicators: IndicatorsResponse;

        try {
            marketData = await this.getMarketData(symbol.name, timeframe);
            indicators = await this.indicatorsService.getIndicators({
                symbol: symbol.name,
                interval: timeframe === TimeframeEnum.OneDay ? "D" : "W",
                candles: 30
            });
        } catch (err) {
            console.error(err);
            throw err;
        }

        const userContent = `Исторические данные: ${JSON.stringify(marketData)} Индикаторы: ${indicators}. Так же самостоятельно расчитай и другие индикаторы, которые тебе необходимы для полноценного анализа. В ответе их отдавать не нужно`;

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
                    prompt: getTickerAnalysisPrompt(timeframe, currentPrice),
                    schema: getTickerAnalysisSchema(timeframe, currentPrice)
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

                const closedAt = new Date(
                    Date.now() + (timeframe === TimeframeEnum.OneDay ? 1000 * 60 * 60 * 24 : 1000 * 60 * 60 * 24 * 7)
                );

                if (!aiResponse.direction || aiResponse.direction === "Nothing") {
                    return;
                }

                const saveData: CreateTickerProcessingDto = {
                    stopLoss: aiResponse.stopLoss,
                    takeProfit: aiResponse.takeProfit,
                    leverage: aiResponse.leverage,
                    timeframe,
                    predictedPrice: aiResponse.predictedPrice,
                    currentPrice,
                    tickerId: symbol.id,
                    direction: aiResponse.direction,
                    closedAt,
                    model:
                        service === this.chatgptService
                            ? Models.Gpt5
                            : service === this.deepseekService
                              ? Models.DeepseekR1T
                              : Models.Qwen3
                };

                await this.tickerResultsService.create(saveData);
            } catch (err) {
                this.logger.error(err.message);
                throw err;
            }
        };

        const services = [this.chatgptService, this.deepseekService, this.qwenService];

        for (const service of services) {
            try {
                await sendDataToAi(service);
            } catch {
                /* empty */
            }
        }
    }

    private async getMarketData(symbol: string, timeframe: TimeframeEnum) {
        let fifteenMinutes: SymbolDataResponseDto[] | undefined;
        let oneHour: SymbolDataResponseDto[] | undefined;
        let oneDay: SymbolDataResponseDto[] | undefined;
        let oneWeek: SymbolDataResponseDto[] | undefined;

        if (timeframe === TimeframeEnum.OneDay) {
            [fifteenMinutes, oneHour, oneDay, oneWeek] = await Promise.all([
                this.marketDataService.getSymbolData({
                    symbol,
                    candles: 10,
                    interval: "15"
                }),
                this.marketDataService.getSymbolData({
                    symbol,
                    candles: 15,
                    interval: "60"
                }),
                this.marketDataService.getSymbolData({
                    symbol,
                    candles: 20,
                    interval: "D"
                }),
                this.marketDataService.getSymbolData({
                    symbol,
                    candles: 5,
                    interval: "W"
                })
            ]);
        } else {
            [oneHour, oneDay, oneWeek] = await Promise.all([
                this.marketDataService.getSymbolData({
                    symbol,
                    candles: 10,
                    interval: "60"
                }),
                this.marketDataService.getSymbolData({
                    symbol,
                    candles: 10,
                    interval: "D"
                }),
                this.marketDataService.getSymbolData({
                    symbol,
                    candles: 25,
                    interval: "W"
                })
            ]);
        }

        return {
            fifteenMinutes,
            oneHour,
            oneDay,
            oneWeek
        };
    }
}
