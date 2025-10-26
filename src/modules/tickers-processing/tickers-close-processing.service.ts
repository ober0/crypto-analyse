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

    @Cron("0 1 * * *", {
        timeZone: "Europe/Moscow"
    })
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

                const direction = ticker.direction;

                let resultPredicted: number;

                if (direction === "Long") {
                    resultPredicted = Math.min(realPrice, ticker.predictedPrice);
                } else {
                    resultPredicted = Math.max(realPrice, ticker.predictedPrice);
                }

                const difference =
                    Number((resultPredicted - ticker.currentPrice).toFixed(4)) * (direction === "Long" ? 1 : -1);
                const unrealizedDifference =
                    Number((realPrice - ticker.currentPrice).toFixed(4)) * (direction === "Long" ? 1 : -1);

                const pnl = Number(((difference / ticker.currentPrice) * 100).toFixed(2));
                const unrealizedPnl = Number(((unrealizedDifference / ticker.currentPrice) * 100).toFixed(2));

                await this.tickerResultsService.update(ticker.id, {
                    realPrice,
                    difference,
                    unrealizedDifference,
                    pnl,
                    unrealizedPnl,
                    isClosed: true
                });
            })
        );

        const total = result.length;
        const success = result.filter((i) => i.status === "fulfilled").length;

        this.logger.log(`Успешно обработано результатов: ${success}/${total}`);
    }
}
