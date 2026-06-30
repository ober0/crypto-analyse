import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { TickerResultsService } from "./ticker-results.service";
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SearchTickerResultsDto, TickerResultsSearchResponseDto } from "./types/search";
import { JwtAuthGuardHttp } from "../auth/guards/auth.guard";
import { UsageByModelItemDto } from "./types/usage";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("ticker-results")
@ApiTags("Ticker Results")
export class TickerResultsController {
    constructor(private readonly service: TickerResultsService) {}

    @Post("search")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Поиск обработанных тикеров" })
    @ApiOkResponse({ type: TickerResultsSearchResponseDto })
    async search(@Body() dto: SearchTickerResultsDto): Promise<TickerResultsSearchResponseDto> {
        return this.service.search(dto);
    }

    @Get("usage/total")
    @HttpCode(HttpStatus.OK)
    @ApiSecurity("bearer")
    @UseGuards(JwtAuthGuardHttp, AdminGuard)
    @ApiOperation({ summary: "получение использованных токенов с группировкой по моделям" })
    @ApiOkResponse({ type: UsageByModelItemDto, isArray: true })
    async getUsageByModel() {
        return this.service.getUsageByModel();
    }
}
