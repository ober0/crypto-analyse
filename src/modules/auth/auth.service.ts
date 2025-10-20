import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { UserService } from "../user/user.service";
import { AuthRepository } from "./auth.repository";
import { LoginDto } from "./dto/login.dto";
import { UserResponseDto } from "../user/dto/response.dto";
import { GeneratedTokens, LoginResponseDto, TokenPayload } from "./dto/tokens.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
    private readonly saltRounds = process.env.SALT_ROUNDS;
    constructor(
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly authRepository: AuthRepository,
        private readonly configService: ConfigService<{ JWT_REFRESH_SECRET: string; JWT_ACCESS_SECRET: string }, true>
    ) {
        if (!this.saltRounds) {
            throw Error("Не указана SALT_ROUNDS в енвах");
        }
    }

    onModuleInit() {
        if (!this.configService.get<string>("JWT_REFRESH_SECRET")) {
            throw new Error("Не указан JWT_REFRESH_SECRET");
        }

        if (!this.configService.get<string>("JWT_ACCESS_SECRET")) {
            throw new Error("Не указан JWT_ACCESS_SECRET");
        }
    }

    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    async saveToken({ userId, refreshToken }: { userId: number; refreshToken: string }) {
        return this.authRepository.saveToken({ userId, refreshToken });
    }

    async login(dto: LoginDto): Promise<LoginResponseDto & { refreshToken: string }> {
        const user = await this.userService.findOneByUsernameWithPassword(dto.username);
        if (!user) {
            throw new ForbiddenException("Неверные авторизационные данные.");
        }

        const isPasswordMatching = await this.comparePassword(dto.password, user.password);

        if (!isPasswordMatching) {
            throw new BadRequestException("Неверные авторизационные данные.");
        }

        const { refreshToken, accessToken } = this.generateTokens(user);

        const existing = await this.authRepository.findUserToken(user.id);
        if (existing?.id) {
            await this.authRepository.deleteToken(existing.id);
        }

        await this.authRepository.saveToken({ userId: user.id, refreshToken });

        const { password, ...restUser } = user;

        return { accessToken, refreshToken, user: restUser };
    }

    async logout(refreshToken: string) {
        const token = await this.authRepository.findTokenByToken(refreshToken);
        if (!token) {
            throw new ForbiddenException();
        }
        return this.authRepository.deleteToken(token.id);
    }

    async refresh(refreshToken: string): Promise<GeneratedTokens> {
        if (!refreshToken) {
            throw new UnauthorizedException();
        }
        const tokenInDb = await this.authRepository.findTokenByToken(refreshToken);
        if (!tokenInDb) {
            throw new UnauthorizedException();
        }
        let decodedJwt: TokenPayload;
        try {
            decodedJwt = jwt.verify(tokenInDb.token, this.configService.get("JWT_REFRESH_SECRET")) as TokenPayload;
        } catch {
            throw new UnauthorizedException();
        }

        const user: UserResponseDto = await this.userService.findOneById(decodedJwt.id);

        const { refreshToken: newRefreshToken, accessToken } = this.generateTokens(user);

        await this.authRepository.deleteToken(tokenInDb.id);
        await this.authRepository.saveToken({ userId: user.id, refreshToken: newRefreshToken });

        return { refreshToken: newRefreshToken, accessToken };
    }

    generateTokens(user: UserResponseDto): GeneratedTokens {
        const payload: TokenPayload = { id: user.id };

        const accessToken = jwt.sign(payload, this.configService.get("JWT_ACCESS_SECRET")!, {
            expiresIn: "1h"
        });

        const refreshToken = jwt.sign(payload, this.configService.get("JWT_REFRESH_SECRET")!, {
            expiresIn: "7d"
        });

        return { accessToken, refreshToken };
    }
}
