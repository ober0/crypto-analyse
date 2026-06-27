import { SearchBaseDto } from "@app/common-dto/base-search.dto";
import { CommonSearchResponseDto } from "@app/common-dto/search-response.dto";
import { DateMinMaxFilterDto } from "@app/common-dto/min-max.filter.dto";
import { SortDtoGenerator } from "@app/common-dto/sort-generate.dto";
import { Contains } from "@app/tools/contains.decorator";
import { ApiProperty, PartialType, PickType } from "@nestjs/swagger";
import { ProcessingInterval, ProcessingStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { AiProcessingResponseDto } from "./response.dto";

export class AiProcessingListItemDto extends AiProcessingResponseDto {
    @ApiProperty()
    tradesCount: number;

    @ApiProperty({ required: false, type: Number })
    averagePnl: number | null;
}

export class FiltersAiProcessingDto extends PartialType(
    PickType(AiProcessingResponseDto, ["status", "interval", "withWebSearch", "tickersId"])
) {
    @ApiProperty({ enum: ProcessingStatus, isArray: true })
    @IsOptional()
    @IsEnum(ProcessingStatus, { each: true })
    statuses?: ProcessingStatus[];

    @ApiProperty({ enum: ProcessingInterval })
    @IsOptional()
    @Contains()
    interval?: ProcessingInterval;

    @ApiProperty({ type: Number, isArray: true })
    @IsOptional()
    @IsNumber({}, { each: true })
    tickersIds?: number[];
}

export class SortsAiProcessingDto extends SortDtoGenerator({
    itemClass: AiProcessingResponseDto,
    includedValue: ["endAt", "status"]
}) {}

export class SearchAiProcessingDto extends SearchBaseDto<FiltersAiProcessingDto, SortsAiProcessingDto> {
    @ApiProperty({ type: FiltersAiProcessingDto })
    @ValidateNested()
    @Type(() => FiltersAiProcessingDto)
    declare filters: FiltersAiProcessingDto;

    @ApiProperty({ type: SortsAiProcessingDto })
    @ValidateNested()
    @Type(() => SortsAiProcessingDto)
    declare sorts: SortsAiProcessingDto;
}

export class AiProcessingSearchResponseDto extends CommonSearchResponseDto(AiProcessingListItemDto) {}
