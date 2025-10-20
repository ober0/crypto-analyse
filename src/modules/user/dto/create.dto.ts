import { ApiProperty, OmitType } from "@nestjs/swagger";
import { UserBaseDto } from "./base.dto";
import { IsNumber, IsOptional } from "class-validator";

export class UserCreateDto extends OmitType(UserBaseDto, ["id", "createdAt", "role", "roleId", "isActive"]) {
    @ApiProperty()
    @IsOptional()
    @IsNumber()
    roleId?: number;
}
