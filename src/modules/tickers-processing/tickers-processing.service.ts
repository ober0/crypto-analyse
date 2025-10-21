import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TickersService } from "../tickers/tickers.service";

@Injectable()
export class TickersProcessingService {
    constructor(private readonly tickerService: TickersService) {}

    @Cron(CronExpression.EVERY_DAY_AT_NOON)
    async cron() {
        const symbols = await this.tickerService.getAll();

        for (const symbol of symbols) {
            await this.tickerService;
        }
    }
}
