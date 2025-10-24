import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MarketDataService } from "../market-data/market-data.service";
import { TickerResultsService } from "../ticker-results/ticker-results.service";

@Injectable()
export class TickersCloseProcessingService {
    private readonly logger: Logger = new Logger("TickersCloseProcessingService");
    constructor(
        private readonly marketDataService: MarketDataService,
        private readonly tickerResultsService: TickerResultsService
    ) {}

    // async onModuleInit() {
    //     await this.cron();
    // }

    @Cron("0 13 * * *")
    async cron() {
        const tickerPreprocessing = await this.tickerResultsService.findAllByWhere({
            isClosed: false,
            closedAt: {
                lt: new Date()
            }
        });

        const result = await Promise.allSettled(
            tickerPreprocessing.map(async (ticker) => {
                const tickerData = await this.marketDataService.getSymbolData({
                    symbol: ticker.ticker.name,
                    interval: "1",
                    candles: 1
                });
                if (!tickerData.length) {
                    throw Error("Не найдена актуальная цена");
                }

                const realPrice = tickerData.at(0)!.close;

                const difference = Number((realPrice - ticker.predictedPrice).toFixed(3));
                const leverageDifference = Number((difference * (ticker.leverage ?? 1)).toFixed(3));
                const percentDifference = Number(((difference / ticker.predictedPrice) * 100).toFixed(3));

                await this.tickerResultsService.update(ticker.id, {
                    realPrice,
                    difference,
                    leverageDifference,
                    percentDifference,
                    isClosed: true
                });
            })
        );

        const total = result.length;
        const success = result.filter((i) => i.status === "fulfilled").length;

        this.logger.log(`Успешно обработано результатов: ${success}/${total}`);
    }
}
