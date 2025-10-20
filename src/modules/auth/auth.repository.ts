import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RoleNames } from "@prisma/client";
import { SaveTokenDto } from "./dto/tokens.dto";

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    async saveToken(payload: SaveTokenDto) {
        return this.prisma.refreshToken.create({
            data: {
                user: { connect: { id: payload.userId } },
                token: payload.refreshToken
            }
        });
    }

    async findTokenByToken(refreshToken: string) {
        return this.prisma.refreshToken.findFirst({
            where: { token: refreshToken }
        });
    }

    async deleteToken(tokenId: string) {
        return this.prisma.refreshToken.delete({
            where: { id: tokenId }
        });
    }

    async findUserToken(userId: number) {
        return this.prisma.refreshToken.findFirst({
            where: { userId }
        });
    }

    async findRoleByName(name: RoleNames) {
        return this.prisma.role.findUnique({
            where: { name }
        });
    }
}
