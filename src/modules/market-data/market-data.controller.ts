import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuardHttp } from "../auth/guards/auth.guard";
import { MarketDataService } from "./market-data.service";
import { SymbolDataResponseDto } from "./dto/response.dto";
import { GetMarketDataDto } from "./dto/get-symbol-data.dto";

@Controller("market-data")
@ApiTags("Market Data")
export class MarketDataController {
    constructor(private readonly marketDataService: MarketDataService) {}

    @Get("/:symbolId")
    @ApiOkResponse({
        type: SymbolDataResponseDto,
        isArray: true
    })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Получить данные графика" })
    async getMarketData(@Query() dto: GetMarketDataDto, @Param("symbolId", ParseIntPipe) symbolId: number) {
        return this.marketDataService.getMarketData(symbolId, dto);
    }
}
