import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, ValidateNested } from "class-validator";
import { SearchBaseDto } from "@app/common-dto/base-search.dto";
import { UserBaseDto } from "./base.dto";
import { SortDtoGenerator } from "@app/common-dto/sort-generate.dto";
import { DateMinMaxFilterDto } from "@app/common-dto/min-max.filter.dto";

export class UserFilterDto extends PartialType(OmitType(UserBaseDto, ["role", "roleId", "password", "createdAt"])) {
    @ApiProperty({ type: DateMinMaxFilterDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DateMinMaxFilterDto)
    createdAt?: DateMinMaxFilterDto;
}

export class UserSortDto extends SortDtoGenerator({
    itemClass: UserBaseDto,
    includedValue: ["createdAt"]
}) {}

export class UserSearchDto extends SearchBaseDto<UserFilterDto, UserSortDto> {
    @ApiProperty({ type: UserFilterDto })
    @ValidateNested()
    @Type(() => UserFilterDto)
    declare filters: UserFilterDto;

    @ApiProperty({ type: UserSortDto })
    @ValidateNested()
    @Type(() => UserSortDto)
    declare sorts: UserSortDto;
}
