import { Module } from "@nestjs/common";
import { TickersProcessingService } from "./tickers-processing.service";
import { TickersModule } from "../tickers/tickers.module";
import { ChatgptModule } from "../chatgpt/chatgpt.module";
import { MarketDataModule } from "../market-data/market-data.module";
import { TickerResultsModule } from "../ticker-results/ticker-results.module";

@Module({
    providers: [TickersProcessingService],
    imports: [TickersModule, ChatgptModule, MarketDataModule, TickerResultsModule]
})
export class TickersProcessingModule {}
