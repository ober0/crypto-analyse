import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { UserBaseDto } from "./base.dto";
import { IsNumber, IsOptional, ValidateNested } from "class-validator";

export class UserUpdateDto extends PartialType(
    OmitType(UserBaseDto, ["id", "createdAt", "role", "password", "username", "roleId"])
) {
    @ApiProperty()
    @IsOptional()
    @IsNumber()
    roleId?: number;
}
