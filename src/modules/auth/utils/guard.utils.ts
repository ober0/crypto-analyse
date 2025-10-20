import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UserResponseDto } from "../../user/dto/response.dto";
import { TokenPayload } from "../dto/tokens.dto";

export async function getUserFromToken(
    token: string,
    configService: ConfigService<{ JWT_ACCESS_SECRET: string }, true>,
    prismaService: PrismaService
): Promise<UserResponseDto> {
    let payload: TokenPayload;

    try {
        payload = jwt.verify(token, configService.get("JWT_ACCESS_SECRET")!) as TokenPayload;
    } catch {
        throw new UnauthorizedException("Неверный токен");
    }

    const user = await prismaService.user.findUnique({
        where: { id: payload.id },
        include: { role: true }
    });

    if (!user) {
        throw new UnauthorizedException("Пользователь не найден");
    }

    return user as UserResponseDto;
}
