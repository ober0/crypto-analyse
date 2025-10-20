import { CanActivate, ExecutionContext, Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { getUserFromToken } from "../utils/guard.utils";
import { UserResponseDto } from "../../user/dto/response.dto";

@Injectable()
export class JwtAuthGuardWs implements CanActivate {
    constructor(
        private readonly configService: ConfigService<{ JWT_ACCESS_SECRET: string }, true>,
        private readonly prismaService: PrismaService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== "ws") {
            throw new BadRequestException("Неверный тип запроса");
        }

        const client = context.switchToWs().getClient();
        const token = client.handshake?.auth?.accessToken;

        const user: UserResponseDto = await getUserFromToken(token, this.configService, this.prismaService);
        client.user = user;

        return true;
    }
}
