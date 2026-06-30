import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuardHttp } from "../auth/guards/auth.guard";
import { DecodeUser } from "../auth/decorators/decode-user";
import { UserBaseDto } from "../user/dto/base.dto";
import { AiProcessingCrudService } from "./ai-processing.crud.service";
import { CreateAiProcessingDto } from "./types/create.dto";
import { AiProcessingDetailResponseDto, AiProcessingResponseDto } from "./types/response.dto";
import { AiProcessingSearchResponseDto, SearchAiProcessingDto } from "./types/search";
import { AiProcessingStatsRequestDto, AiProcessingStatsResponseDto } from "./types/stats.dto";
import { UsageByModelItemDto } from "../ticker-results/types/usage";
import { AdminGuard } from "../auth/guards/admin.guard";
import { UpdateAiProcessingDto } from "./types/update.dto";

@Controller("ai-processing")
@ApiTags("AI Processing")
export class AiProcessingController {
    constructor(private readonly service: AiProcessingCrudService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Создать Торгового бота" })
    @ApiOkResponse({ type: AiProcessingResponseDto })
    @ApiSecurity("bearer")
    @UseGuards(JwtAuthGuardHttp, AdminGuard)
    async create(
        @DecodeUser() user: UserBaseDto,
        @Body() dto: CreateAiProcessingDto
    ): Promise<AiProcessingResponseDto> {
        return this.service.create(user.id, dto);
    }

    @Patch(":id")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Обновить Торгового бота" })
    @ApiOkResponse({ type: AiProcessingResponseDto })
    @ApiSecurity("bearer")
    @UseGuards(JwtAuthGuardHttp, AdminGuard)
    async update(
        @DecodeUser() user: UserBaseDto,
        @Body() dto: UpdateAiProcessingDto,
        @Param("id", ParseIntPipe) id: number
    ): Promise<AiProcessingResponseDto> {
        return this.service.update(id, dto, user.id);
    }

    @Post("search")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Поиск Торгового бота" })
    @ApiOkResponse({ type: AiProcessingSearchResponseDto })
    async search(@Body() dto: SearchAiProcessingDto): Promise<AiProcessingSearchResponseDto> {
        return this.service.search(dto);
    }

    @Post("stats")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Статистика Торгового бота" })
    @ApiOkResponse({ type: AiProcessingStatsResponseDto })
    async getStats(@Body() dto: AiProcessingStatsRequestDto): Promise<AiProcessingStatsResponseDto> {
        return this.service.getStats(dto);
    }

    @Get(":id")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Детальный просмотр Торгового бота" })
    @ApiOkResponse({ type: AiProcessingDetailResponseDto })
    async findOne(@Param("id", ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post(":id/enable")
    @HttpCode(HttpStatus.OK)
    @ApiSecurity("bearer")
    @UseGuards(JwtAuthGuardHttp, AdminGuard)
    @ApiOperation({ summary: "Включить Торгового бота" })
    @ApiOkResponse({ type: AiProcessingResponseDto })
    async enable(
        @DecodeUser() user: UserBaseDto,
        @Param("id", ParseIntPipe) id: number
    ): Promise<AiProcessingResponseDto> {
        return this.service.enable(user.id, id);
    }

    @Post(":id/disable")
    @HttpCode(HttpStatus.OK)
    @ApiSecurity("bearer")
    @UseGuards(JwtAuthGuardHttp, AdminGuard)
    @ApiOperation({ summary: "Выключить Торгового бота" })
    @ApiOkResponse({ type: AiProcessingResponseDto })
    async disable(
        @DecodeUser() user: UserBaseDto,
        @Param("id", ParseIntPipe) id: number
    ): Promise<AiProcessingResponseDto> {
        return this.service.disable(user.id, id);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    @ApiSecurity("bearer")
    @UseGuards(JwtAuthGuardHttp, AdminGuard)
    @ApiOperation({ summary: "удалить торгового бота" })
    @ApiOkResponse({ type: AiProcessingResponseDto })
    async delete(@DecodeUser() user: UserBaseDto, @Param("id", ParseIntPipe) id: number) {
        return this.service.delete(user.id, id);
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
