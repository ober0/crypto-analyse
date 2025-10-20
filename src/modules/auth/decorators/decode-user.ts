import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserBaseDto } from "../../user/dto/base.dto";
import { UserResponseDto } from "../../user/dto/response.dto";

export const DecodeUser = createParamDecorator((data: unknown, context: ExecutionContext): UserResponseDto => {
    return context.switchToHttp().getRequest().user;
});
