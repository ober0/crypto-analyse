import { Module } from "@nestjs/common";
import { TickersModule } from "../tickers/tickers.module";
import { AiProcessingController } from "./ai-processing.controller";
import { AiProcessingRepository } from "./ai-processing.repository";
import { AiProcessingService } from "./ai-processing.service";

@Module({
    imports: [TickersModule],
    providers: [AiProcessingService, AiProcessingRepository],
    controllers: [AiProcessingController],
    exports: [AiProcessingService]
})
export class AiProcessingModule {}
