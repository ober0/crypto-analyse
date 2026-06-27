import { Body, Controller, ForbiddenException, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
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

        response.cookie("accessToken", data.refreshToken, {
            secure: true,
            sameSite: "none",
            httpOnly: true,
            maxAge: 1000 * 60 * 10 // 10 минут
        });

        response.cookie("refreshToken", data.refreshToken, {
            secure: true,
            sameSite: "none",
            httpOnly: true,
            maxAge: 1000 * 3600 * 24 * 7 // 7 дней
        });

        return {
            user: data.user
        };
    }

    @ApiOperation({ summary: "Обновление токенов" })
    @HttpCode(HttpStatus.OK)
    @Post("refresh")
    async refresh(@Req() request: express.Request, @Res({ passthrough: true }) response: express.Response) {
        const refreshToken = request.cookies["refreshToken"];
        if (!refreshToken) {
            throw new ForbiddenException("Refresh токен не найден");
        }

        const data = await this.authService.refresh(refreshToken);

        response.cookie("accessToken", data.refreshToken, {
            secure: true,
            sameSite: "none",
            httpOnly: true,
            maxAge: 1000 * 60 * 10 // 10 минут
        });

        response.cookie("refreshToken", data.refreshToken, {
            secure: true,
            sameSite: "none",
            httpOnly: true,
            maxAge: 1000 * 3600 * 24 * 7 // 7 дней
        });
    }

    @ApiOperation({ summary: "Выход пользователя" })
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse()
    @Post("logout")
    async logout(
        @Req() request: express.Request,
        @Res({ passthrough: true }) response: express.Response
    ): Promise<void> {
        const refreshToken = request.cookies["refreshToken"];
        if (!refreshToken) {
            throw new ForbiddenException("Refresh токен не найден");
        }

        response.clearCookie("accessToken", {
            secure: true,
            sameSite: "none",
            httpOnly: true
        });

        response.clearCookie("refreshToken", {
            secure: true,
            sameSite: "none",
            httpOnly: true
        });

        await this.authService.logout(refreshToken);
    }
}
