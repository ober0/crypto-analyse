import { SearchBaseDto } from "@app/common-dto/base-search.dto";
import { CommonSearchResponseDto } from "@app/common-dto/search-response.dto";
import { SortDtoGenerator } from "@app/common-dto/sort-generate.dto";
import { ApiProperty, PartialType, PickType } from "@nestjs/swagger";
import { Models, ProcessingInterval, ProcessingStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { AiProcessingResponseDto } from "./response.dto";

export class AiProcessingListItemDto extends AiProcessingResponseDto {
    @ApiProperty()
    tradesCount: number;

    @ApiProperty({ required: false, type: Number })
    averagePnl: number | null;

    @ApiProperty({ required: false, type: Number })
    totalPnl: number | null;

    @ApiProperty({ required: false, type: Number })
    averagePnlPercent: number | null;

    @ApiProperty({ required: false, type: Number })
    totalPnlPercent: number | null;
}

export class FiltersAiProcessingDto extends PartialType(
    PickType(AiProcessingResponseDto, ["withWebSearch", "tickersId"])
) {
    @ApiProperty({ enum: Models })
    @IsOptional()
    @IsEnum(Models)
    model?: Models;

    @ApiProperty({ enum: ProcessingStatus })
    @IsOptional()
    @IsEnum(ProcessingStatus)
    status?: ProcessingStatus;

    @ApiProperty({ enum: ProcessingInterval })
    @IsOptional()
    @IsEnum(ProcessingInterval)
    interval?: ProcessingInterval;

    @ApiProperty({ enum: ProcessingStatus, isArray: true })
    @IsOptional()
    @IsEnum(ProcessingStatus, { each: true })
    statuses?: ProcessingStatus[];

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
