import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsString, MinLength, ValidateNested } from "class-validator";
import { RoleBaseDto } from "./role.dto";

export class UserBaseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    username: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({ type: RoleBaseDto })
    @ValidateNested()
    @Type(() => RoleBaseDto)
    role: RoleBaseDto;

    @ApiProperty()
    @IsNumber()
    roleId: number;

    @ApiProperty()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    createdAt: Date;
}
