import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuardHttp } from "../auth/guards/auth.guard";
import { TickersService } from "./tickers.service";
import { TickerResponseDto } from "./dto/response.dto";

@Controller("tickers")
@ApiTags("Tickers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuardHttp)
export class TickersController {
    constructor(private readonly tickerService: TickersService) {}

    @Get()
    @ApiOkResponse({ type: TickerResponseDto, isArray: true })
    @ApiOperation({ summary: "Получить список символов на обработке" })
    async getTickers(): Promise<TickerResponseDto[]> {
        return this.tickerService.getAll();
    }
}
