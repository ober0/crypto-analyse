import { ApiProperty, OmitType } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UserResponseDto } from "../../user/dto/response.dto";

export class GeneratedTokens {
    @ApiProperty()
    accessToken: string;
    @ApiProperty()
    refreshToken: string;
}
export class AccessTokenDto {
    @ApiProperty()
    accessToken: string;
}

export class LoginResponseDto extends AccessTokenDto {
    @ApiProperty()
    @ValidateNested()
    @Type(() => UserResponseDto)
    user: UserResponseDto;
}

export class SaveTokenDto {
    userId: number;
    refreshToken: string;
}

export class TokenPayload {
    @ApiProperty()
    id: number;
}
