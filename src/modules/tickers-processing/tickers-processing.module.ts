import { Module } from "@nestjs/common";
import { TickersProcessingService } from "./tickers-processing.service";
import { TickersModule } from "../tickers/tickers.module";
import { MarketDataModule } from "../market-data/market-data.module";
import { TickerResultsModule } from "../ticker-results/ticker-results.module";
import { CustomIndicatorsModule } from "../custom-indicators/custom-indicators.module";
import { TickersCloseProcessingService } from "./tickers-close-processing.service";
import { AiModule } from "../ai/ai.module";

@Module({
    providers: [TickersProcessingService, TickersCloseProcessingService],
    imports: [TickersModule, MarketDataModule, TickerResultsModule, CustomIndicatorsModule, AiModule]
})
export class TickersProcessingModule {}
