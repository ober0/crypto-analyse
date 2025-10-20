import { Body, Controller, HttpCode, HttpStatus, Post, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LoginDto } from "./dto/login.dto";
import express from "express";
import { AccessTokenDto, LoginResponseDto } from "./dto/tokens.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOperation({ summary: "Вход пользователя" })
    @HttpCode(HttpStatus.OK)
    @Post("login")
    @ApiOkResponse({ type: LoginResponseDto })
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) response: express.Response
    ): Promise<LoginResponseDto> {
        const data = await this.authService.login(loginDto);

        response.cookie("refreshToken", data.refreshToken, {
            secure: true,
            sameSite: "none",
            httpOnly: true,
            maxAge: 1000 * 3600 * 24 * 7 // 7 дней
        });

        response.cookie("accessToken", data.accessToken, {
            secure: true,
            sameSite: "none",
            httpOnly: false,
            maxAge: 1000 * 3600 // 1 час
        });

        return {
            accessToken: data.accessToken,
            user: data.user
        };
    }

    @ApiOperation({ summary: "Обновление токенов" })
    @ApiBody({ schema: { type: "object", properties: { refreshToken: { type: "string" } } } })
    @ApiOkResponse({ type: AccessTokenDto })
    @HttpCode(HttpStatus.OK)
    @Post("refresh")
    async refresh(
        @Body("refreshToken") refreshToken: string,
        @Res({ passthrough: true }) response: express.Response
    ): Promise<AccessTokenDto> {
        const data = await this.authService.refresh(refreshToken);

        response.cookie("refreshToken", data.refreshToken, {
            secure: true,
            sameSite: "none",
            httpOnly: true,
            maxAge: 1000 * 3600 * 24 * 7 // 7 дней
        });

        response.cookie("accessToken", data.accessToken, {
            secure: true,
            sameSite: "none",
            httpOnly: false,
            maxAge: 1000 * 3600 // 1 час
        });

        return {
            accessToken: data.accessToken
        };
    }

    @ApiOperation({ summary: "Выход пользователя" })
    @ApiBody({ schema: { type: "object", properties: { refreshToken: { type: "string" } } } })
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse()
    @Post("logout")
    async logout(@Body("refreshToken") refreshToken: string): Promise<void> {
        await this.authService.logout(refreshToken);
    }
}
