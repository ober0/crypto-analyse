import { Module } from "@nestjs/common";
import { TickerResultsService } from "./ticker-results.service";
import { TickerResultsController } from "./ticker-results.controller";
import { TickerResultsRepository } from "./ticker-results.repository";

@Module({
    providers: [TickerResultsService, TickerResultsRepository],
    controllers: [TickerResultsController],
    exports: [TickerResultsService]
})
export class TickerResultsModule {}
