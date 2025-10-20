import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { UserResponseDto, UserSearchResponseDto } from "./dto/response.dto";
import { UserCreateDto } from "./dto/create.dto";
import { UserRepository } from "./user.repository";
import * as bcrypt from "bcrypt";
import { RoleNames } from "@prisma/client";
import { UserUpdateDto } from "./dto/update.dto";
import { UserSearchDto } from "./dto/search.dto";

@Injectable()
export class UserService {
    private readonly saltRounds: string | undefined = undefined;

    constructor(private readonly repository: UserRepository) {
        this.saltRounds = process.env.SALT_ROUNDS;
        if (!this.saltRounds) {
            throw new Error("SALT_ROUNDS не указан в енв");
        }
    }

    async create(dto: UserCreateDto): Promise<UserResponseDto> {
        const exist = await this.findOneByUsername(dto.username);
        if (exist) {
            throw new BadRequestException("Пользователь с таким логином уже существует");
        }

        const hashedPassword: string = await bcrypt.hash(dto.password, Number(this.saltRounds));

        let roleId: number;
        if (dto.roleId) {
            const role = await this.repository.findRoleById(dto.roleId);
            if (!role) {
                throw new NotFoundException("Роль не найдена");
            }
            roleId = dto.roleId;
        } else {
            const baseRole = await this.repository.findRoleByName(RoleNames.User);
            if (!baseRole) {
                throw new InternalServerErrorException("Базовое расписание не создано");
            }
            roleId = baseRole.id;
        }

        return this.repository.create(
            {
                ...dto,
                password: hashedPassword
            },
            roleId
        );
    }

    private async findOneByUsername(username: string) {
        return this.repository.findOneByUsername(username);
    }

    async update(id: number, dto: UserUpdateDto, user: UserResponseDto): Promise<UserResponseDto> {
        const exist = await this.findOneById(id);

        if (user.role.name !== RoleNames.Admin) {
            if (exist.id !== user.id) {
                throw new ForbiddenException("Нет доступа");
            }
        }

        if (dto.roleId) {
            const role = await this.repository.findRoleById(dto.roleId);
            if (!role) {
                throw new NotFoundException("Роль не найдена");
            }
        }

        return this.repository.update(id, dto);
    }

    async delete(id: number, user: UserResponseDto): Promise<UserResponseDto> {
        const exist = await this.findOneById(id);

        if (user.role.name !== RoleNames.Admin) {
            if (exist.id !== user.id) {
                throw new ForbiddenException("Нет доступа");
            }
        }

        return this.repository.delete(id);
    }

    async findOneById(id: number): Promise<UserResponseDto> {
        const data = await this.repository.findOneById(id);
        if (!data) {
            throw new NotFoundException("Пользователь не найден");
        }
        return data;
    }

    async search(dto: UserSearchDto): Promise<UserSearchResponseDto> {
        const [data, count] = await Promise.all([this.repository.search(dto), this.repository.count(dto)]);

        return {
            data,
            count
        };
    }

    async findOneByUsernameWithPassword(username: string): Promise<(UserResponseDto & { password: string }) | null> {
        return this.repository.findOneByUsername(username);
    }
}
