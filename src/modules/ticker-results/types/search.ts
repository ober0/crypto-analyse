import { SearchBaseDto } from "@app/common-dto/base-search.dto";
import { IsOptional, ValidateNested } from "class-validator";
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { CommonSearchResponseDto } from "@app/common-dto/search-response.dto";
import { DirectionEnum, TimeframeEnum } from "@prisma/client";
import { Contains } from "@app/tools/contains.decorator";
import { NumberMinMaxFilterDto } from "@app/common-dto/min-max.filter.dto";
import { SortDtoGenerator } from "@app/common-dto/sort-generate.dto";

export class TickerResultsResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    tickersId: number;

    @ApiProperty({ enum: TimeframeEnum })
    @Contains()
    timeframe: TimeframeEnum;

    @ApiProperty({ enum: DirectionEnum })
    @Contains()
    direction: DirectionEnum;

    @ApiProperty({ required: false })
    leverage?: number | null;

    @ApiProperty({ required: false })
    stopLoss?: number | null;

    @ApiProperty({ required: false })
    takeProfit?: number | null;

    @ApiProperty()
    currentPrice: number;

    @ApiProperty()
    predictedPrice: number;

    @ApiProperty({ required: false })
    realPrice?: number | null;

    @ApiProperty({ required: false })
    difference?: number | null;

    @ApiProperty({ required: false })
    leverageDifference?: number | null;

    @ApiProperty({ required: false })
    percentDifference?: number | null;

    @ApiProperty()
    isClosed: boolean;

    @ApiProperty({ required: false })
    closedAt?: Date | null;

    @ApiProperty()
    createdAt: Date;
}

export class FiltersTickerResultsDto extends PartialType(
    OmitType(TickerResultsResponseDto, ["id", "tickersId", "createdAt", "closedAt"])
) {
    @ApiProperty({ type: NumberMinMaxFilterDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => NumberMinMaxFilterDto)
    closedAt?: NumberMinMaxFilterDto;
}
export class SortsTickerResultsDto extends SortDtoGenerator({
    itemClass: TickerResultsResponseDto,
    includedValue: ["percentDifference", "difference", "percentDifference", "direction", "isClosed", "closedAt"]
}) {}

export class SearchTickerResultsDto extends SearchBaseDto<FiltersTickerResultsDto, SortsTickerResultsDto> {
    @ApiProperty({ type: FiltersTickerResultsDto })
    @ValidateNested()
    @Type(() => FiltersTickerResultsDto)
    declare filters: FiltersTickerResultsDto;

    @ApiProperty({ type: SortsTickerResultsDto })
    @ValidateNested()
    @Type(() => SortsTickerResultsDto)
    declare sorts: SortsTickerResultsDto;
}

export class SearchResponseDto extends CommonSearchResponseDto(TickerResultsResponseDto) {}
