import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiSecurity } from "@nestjs/swagger";
import { JwtAuthGuardHttp } from "../auth/guards/auth.guard";
import { UserBaseDto } from "./dto/base.dto";
import { DecodeUser } from "../auth/decorators/decode-user";
import { UserResponseDto } from "./dto/response.dto";
import { UserService } from "./user.service";

@Controller("user")
@Controller("user")
@ApiSecurity("bearer")
@UseGuards(JwtAuthGuardHttp)
export class UserController {
    constructor(private readonly service: UserService) {}

    @ApiOperation({ summary: "Получить информацию о себе" })
    @ApiOkResponse({ type: UserResponseDto })
    @Get("self")
    async findOne(@DecodeUser() user: UserBaseDto): Promise<UserResponseDto> {
        return this.service.findOneById(user.id);
    }
}
