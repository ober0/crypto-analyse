import { Module } from "@nestjs/common";
import { MarketDataModule } from "../market-data/market-data.module";
import { CustomIndicatorsService } from "./custom-indicators.service";

@Module({
    imports: [MarketDataModule],
    providers: [CustomIndicatorsService],
    exports: [CustomIndicatorsService]
})
export class CustomIndicatorsModule {}
