import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserResponseDto } from "./dto/response.dto";
import { UserInclude, UserWithPasswordInclude } from "./const/include.const";

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findOneById(id: number): Promise<UserResponseDto | null> {
        return this.prisma.user.findUnique({
            where: { id },
            ...UserInclude
        });
    }

    async findOneByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
            ...UserWithPasswordInclude
        });
    }
}
