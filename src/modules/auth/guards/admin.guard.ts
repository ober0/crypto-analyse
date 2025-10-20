import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    BadRequestException
} from "@nestjs/common";
import { UserService } from "../../user/user.service";
import { TokenPayload } from "../dto/tokens.dto";
import { RoleNames } from "@prisma/client";
import { UserResponseDto } from "../../user/dto/response.dto";

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly userService: UserService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== "http") {
            throw new BadRequestException("Неверный тип запроса");
        }

        const req = context.switchToHttp().getRequest();

        const jwt: TokenPayload = req.user;
        if (!jwt) {
            throw new UnauthorizedException();
        }

        const user: UserResponseDto = await this.userService.findOneById(jwt.id);

        if (user.role.name !== RoleNames.Admin) {
            throw new ForbiddenException("Нет доступа");
        }

        return true;
    }
}
