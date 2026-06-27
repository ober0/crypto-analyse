import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { getUserFromToken } from "../utils/guard.utils";
import { UserResponseDto } from "../../user/dto/response.dto";

@Injectable()
export class JwtAuthGuardHttp implements CanActivate {
    constructor(
        private readonly configService: ConfigService<{ JWT_ACCESS_SECRET: string }, true>,
        private readonly prismaService: PrismaService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== "http") {
            throw new BadRequestException("Неверный тип запроса");
        }

        const req = context.switchToHttp().getRequest();
        const token = req.cookies?.accessToken;

        const user: UserResponseDto = await getUserFromToken(token, this.configService, this.prismaService);
        req.user = user;

        return true;
    }
}
