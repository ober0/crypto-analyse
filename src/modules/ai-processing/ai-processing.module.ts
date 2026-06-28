import { Module } from "@nestjs/common";
import { TickersModule } from "../tickers/tickers.module";
import { AiProcessingController } from "./ai-processing.controller";
import { AiProcessingRepository } from "./ai-processing.repository";
import { AiProcessingCrudService } from "./ai-processing.crud.service";
import { AiProcessingService } from "./ai-processing.service";
import { AiProcessingCron } from "./ai-processing.cron";
import { MarketDataModule } from "../market-data/market-data.module";

@Module({
    imports: [TickersModule, MarketDataModule],
    providers: [AiProcessingCrudService, AiProcessingService, AiProcessingCron, AiProcessingRepository],
    controllers: [AiProcessingController],
    exports: [AiProcessingCrudService]
})
export class AiProcessingModule {}
