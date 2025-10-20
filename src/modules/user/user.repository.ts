import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserResponseDto } from "./dto/response.dto";
import { UserCreateDto } from "./dto/create.dto";
import { UserInclude, UserWithPasswordInclude } from "./const/include.const";
import { UserUpdateDto } from "./dto/update.dto";
import { UserSearchDto } from "./dto/search.dto";
import { Prisma, RoleNames } from "@prisma/client";
import { mapSearch } from "@app/tools/map.search";
import { mapSort } from "@app/tools/map.sort";
import { mapPagination } from "@app/tools/map.pagination";

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: UserCreateDto, roleId: number): Promise<UserResponseDto> {
        return this.prisma.user.create({
            data: {
                username: dto.username,
                password: dto.password,
                role: {
                    connect: {
                        id: roleId
                    }
                }
            },
            ...UserInclude
        });
    }

    async update(id: number, dto: UserUpdateDto): Promise<UserResponseDto> {
        return this.prisma.user.update({
            where: {
                id
            },
            data: {
                role: dto.roleId
                    ? {
                          connect: {
                              id: dto.roleId
                          }
                      }
                    : undefined
            },
            ...UserInclude
        });
    }

    async delete(id: number): Promise<UserResponseDto> {
        return this.prisma.user.delete({
            where: {
                id
            },
            ...UserInclude
        });
    }

    private buildWhere(dto: UserSearchDto): Prisma.UserWhereInput {
        return mapSearch(dto.filters, [], [], dto.query, ["username"]);
    }

    async search(dto: UserSearchDto): Promise<UserResponseDto[]> {
        return this.prisma.user.findMany({
            where: this.buildWhere(dto),
            orderBy: mapSort(dto.sorts),
            ...mapPagination(dto.pagination),
            ...UserInclude
        });
    }

    async count(dto: UserSearchDto): Promise<number> {
        return this.prisma.user.count({
            where: this.buildWhere(dto)
        });
    }

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

    async findRoleById(id: number) {
        return this.prisma.role.findUnique({
            where: { id }
        });
    }

    async findRoleByName(name: RoleNames) {
        return this.prisma.role.findUnique({
            where: { name }
        });
    }
}
