import { Injectable, NotFoundException } from "@nestjs/common";
import { UserResponseDto } from "./dto/response.dto";
import { UserRepository } from "./user.repository";

@Injectable()
export class UserService {
    private readonly saltRounds: string | undefined = undefined;

    constructor(private readonly repository: UserRepository) {
        this.saltRounds = process.env.SALT_ROUNDS;
        if (!this.saltRounds) {
            throw new Error("SALT_ROUNDS не указан в енв");
        }
    }

    async findOneById(id: number): Promise<UserResponseDto> {
        const data = await this.repository.findOneById(id);
        if (!data) {
            throw new NotFoundException("Пользователь не найден");
        }
        return data;
    }

    async findOneByUsernameWithPassword(username: string): Promise<(UserResponseDto & { password: string }) | null> {
        return this.repository.findOneByUsername(username);
    }
}
