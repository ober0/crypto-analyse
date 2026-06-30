import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { tool } from "@langchain/core/tools";
import { ExaService } from "../../exa/exa.service";
import { MarketDataService } from "../../market-data/market-data.service";
import { CustomIndicatorsService } from "../../custom-indicators/custom-indicators.service";

import { ExaSearchType, webSearchSchema } from "../tools-schemas/web-search.schema";
import { MarketDataType, marketDataSchema } from "../tools-schemas/market-data.schema";
import { IndicatorsType, indicatorsSchema } from "../tools-schemas/indicators.schema";

@Injectable()
export class ToolsService implements OnModuleInit {
    private readonly logger = new Logger(ToolsService.name);

    constructor(
        private readonly exa: ExaService,
        private readonly marketDataService: MarketDataService,
        private readonly indicatorsService: CustomIndicatorsService
    ) {}

    public webSearchTool!: ReturnType<typeof tool>;
    public marketDataTool!: ReturnType<typeof tool>;
    public indicatorsTool!: ReturnType<typeof tool>;

    onModuleInit() {
        this.webSearchTool = tool(
            async (data: ExaSearchType) => {
                this.logger.log(`[webSearch] ${JSON.stringify(data)}`);

                const result = await this.exa.search(data);

                return JSON.stringify(result.results);
            },
            {
                name: "webSearch",
                description: "Ищет актуальную информацию в интернете",
                schema: webSearchSchema
            }
        );

        this.marketDataTool = tool(
            async (data: MarketDataType, config) => {
                this.logger.log(`[marketData] ${JSON.stringify(data)}`);

                const ticker = config.configurable.ticker;

                if (!ticker) {
                    return "Внутренняя ошибка: Не указан тикер";
                }

                const result = await this.marketDataService.getSymbolData({
                    interval: data.interval,
                    symbol: ticker,
                    candles: data.candles
                });

                return JSON.stringify(result);
            },
            {
                name: "marketData",
                description: "Показывает свечи графика",
                schema: marketDataSchema
            }
        );

        this.indicatorsTool = tool(
            async (data: IndicatorsType, config) => {
                this.logger.log(`[indicators] ${JSON.stringify(data)}`);

                const ticker = config.configurable.ticker;

                if (!ticker) {
                    return "Внутренняя ошибка: Не указан тикер";
                }

                const indicators = await this.indicatorsService.getIndicators({
                    interval: data.interval,
                    symbol: ticker,
                    candles: data.candles
                });

                return JSON.stringify(indicators);
            },
            {
                name: "indicators",
                description: "Получает индикаторы",
                schema: indicatorsSchema
            }
        );
    }
}
