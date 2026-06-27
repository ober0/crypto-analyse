import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
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

@Controller("ai-processing")
@ApiTags("AI Processing")
@ApiSecurity("bearer")
@UseGuards(JwtAuthGuardHttp)
export class AiProcessingController {
    constructor(private readonly service: AiProcessingCrudService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Создать Торгового бота" })
    @ApiOkResponse({ type: AiProcessingResponseDto })
    async create(
        @DecodeUser() user: UserBaseDto,
        @Body() dto: CreateAiProcessingDto
    ): Promise<AiProcessingResponseDto> {
        return this.service.create(user.id, dto);
    }

    @Post("search")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Поиск Торгового бота" })
    @ApiOkResponse({ type: AiProcessingSearchResponseDto })
    async search(
        @DecodeUser() user: UserBaseDto,
        @Body() dto: SearchAiProcessingDto
    ): Promise<AiProcessingSearchResponseDto> {
        return this.service.search(user.id, dto);
    }

    @Post("stats")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Статистика Торгового бота" })
    @ApiOkResponse({ type: AiProcessingStatsResponseDto })
    async getStats(
        @DecodeUser() user: UserBaseDto,
        @Body() dto: AiProcessingStatsRequestDto
    ): Promise<AiProcessingStatsResponseDto> {
        return this.service.getStats(user.id, dto);
    }

    @Get(":id")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Детальный просмотр Торгового бота" })
    @ApiOkResponse({ type: AiProcessingDetailResponseDto })
    async findOne(@DecodeUser() user: UserBaseDto, @Param("id", ParseIntPipe) id: number) {
        return this.service.findOne(user.id, id);
    }

    @Post(":id/enable")
    @HttpCode(HttpStatus.OK)
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
    @ApiOperation({ summary: "удалить торгового бота" })
    @ApiOkResponse({ type: AiProcessingResponseDto })
    async delete(@DecodeUser() user: UserBaseDto, @Param("id", ParseIntPipe) id: number) {
        return this.service.delete(user.id, id);
    }
}
