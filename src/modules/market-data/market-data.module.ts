import { Module } from "@nestjs/common";
import { MarketDataService } from "./market-data.service";
import { MarketDataController } from "./market-data.controller";
import { TickersModule } from "../tickers/tickers.module";

@Module({
    imports: [TickersModule],
    providers: [MarketDataService],
    exports: [MarketDataService],
    controllers: [MarketDataController]
})
export class MarketDataModule {}
