import { Module } from "@nestjs/common";
import { TickersProcessingService } from "./tickers-processing.service";
import { TickersModule } from "../tickers/tickers.module";
import { ChatgptModule } from "../chatgpt/chatgpt.module";
import { MarketDataModule } from "../market-data/market-data.module";
import { TickerResultsModule } from "../ticker-results/ticker-results.module";
import { CustomIndicatorsModule } from "../custom-indicators/custom-indicators.module";
import { DeepseekModule } from "../deepseek/deepseek.module";
import { TickersCloseProcessingService } from "./tickers-close-processing.service";
import { LlamaModule } from "../llama/llama.module";

@Module({
    providers: [TickersProcessingService, TickersCloseProcessingService],
    imports: [
        TickersModule,
        ChatgptModule,
        MarketDataModule,
        TickerResultsModule,
        CustomIndicatorsModule,
        DeepseekModule,
        LlamaModule
    ]
})
export class TickersProcessingModule {}
