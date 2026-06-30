import { Module } from "@nestjs/common";
import { AiService } from "./services/ai.service";
import { MarketDataModule } from "../market-data/market-data.module";
import { CustomIndicatorsModule } from "../custom-indicators/custom-indicators.module";
import { ToolsService } from "./services/tools.service";
import { ExaModule } from "../exa/exa.module";

@Module({
    imports: [MarketDataModule, CustomIndicatorsModule, ExaModule],
    providers: [AiService, ToolsService],
    exports: [AiService, ToolsService]
})
export class AiModule {}
