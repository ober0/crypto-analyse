import { UserBaseDto } from "./base.dto";
import { CommonSearchResponseDto } from "@app/common-dto/search-response.dto";
import { OmitType } from "@nestjs/swagger";

export class UserResponseDto extends OmitType(UserBaseDto, ["password"]) {}

export class UserSearchResponseDto extends CommonSearchResponseDto(UserResponseDto) {}
