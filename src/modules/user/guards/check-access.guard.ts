import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { RoleNames } from "@prisma/client";
import { UserBaseDto } from "../dto/base.dto";
import { UserResponseDto } from "../dto/response.dto";

@Injectable()
export class UpsertUserCheckAccessGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user as UserResponseDto;

        const isAdmin = user?.role?.name === RoleNames.Admin;

        const body = request.body ?? {};

        console.log(isAdmin);

        if ((body?.roleId || body?.isActive) && !isAdmin) {
            throw new ForbiddenException("Изменение роли и статуса активности доступно только администратору");
        }

        return true;
    }
}
