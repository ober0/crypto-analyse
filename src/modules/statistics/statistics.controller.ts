import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { StatisticsService } from "./statistics.service";
import { StatisticsRequestDto } from "./dto/request";
import { JwtAuthGuardHttp } from "../auth/guards/auth.guard";
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../auth/guards/admin.guard";
import { PrismaResponse } from "./dto/prisma-response";
import { StatisticsResponseDto } from "./dto/response";

@Controller("statistics")
@ApiTags("Statistics")
export class StatisticsController {
    constructor(private readonly service: StatisticsService) {}

    @Post("generate")
    @ApiOperation({ summary: "Получить статистику" })
    @ApiOkResponse({ type: StatisticsResponseDto })
    @HttpCode(HttpStatus.OK)
    async getStatistics(@Body() data: StatisticsRequestDto): Promise<StatisticsResponseDto[]> {
        return this.service.getStatistics(data);
    }
}
