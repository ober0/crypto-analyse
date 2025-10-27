import { Module } from "@nestjs/common";
import { StatisticsController } from "./statistics.controller";
import { StatisticsService } from "./statistics.service";
import { StatisticsRepository } from "./statistics.repository";
import { TickersModule } from "../tickers/tickers.module";

@Module({
    imports: [TickersModule],
    controllers: [StatisticsController],
    providers: [StatisticsService, StatisticsRepository]
})
export class StatisticsModule {}
