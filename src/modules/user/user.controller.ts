import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { UserCreateDto } from "./dto/create.dto";
import { UserResponseDto, UserSearchResponseDto } from "./dto/response.dto";
import { UserUpdateDto } from "./dto/update.dto";
import { DecodeUser } from "../auth/decorators/decode-user";
import { UserSearchDto } from "./dto/search.dto";
import { UpsertUserCheckAccessGuard } from "./guards/check-access.guard";

@Controller("user")
@ApiTags("User")
export class UserController {
    constructor(private readonly service: UserService) {}

    @ApiOperation({ summary: "Получить информацию о себе" })
    @Get("self")
    async self(@DecodeUser() user: UserResponseDto): Promise<UserResponseDto> {
        return this.service.findOneById(user.id);
    }

    @Post()
    @ApiOperation({ summary: "Создать пользователя" })
    @ApiCreatedResponse({ type: UserResponseDto })
    @UseGuards(UpsertUserCheckAccessGuard)
    async create(@Body() dto: UserCreateDto): Promise<UserResponseDto> {
        return this.service.create(dto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Удалить пользователя" })
    @ApiOkResponse({ type: UserResponseDto })
    async delete(@Param("id", ParseIntPipe) id: number, @DecodeUser() user: UserResponseDto): Promise<UserResponseDto> {
        return this.service.delete(id, user);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Обновить пользователя" })
    @ApiOkResponse({ type: UserResponseDto })
    @UseGuards(UpsertUserCheckAccessGuard)
    async update(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UserUpdateDto,
        @DecodeUser() user: UserResponseDto
    ): Promise<UserResponseDto> {
        return this.service.update(id, dto, user);
    }

    @Post("search")
    @ApiOperation({ summary: "Поиск пользователя" })
    @ApiOkResponse({ type: UserSearchResponseDto })
    @HttpCode(200)
    async search(@Body() dto: UserSearchDto): Promise<UserSearchResponseDto> {
        return this.service.search(dto);
    }
}
