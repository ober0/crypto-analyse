import { SearchBaseDto } from "@app/common-dto/base-search.dto";
import { IsArray, IsNumber, isNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { CommonSearchResponseDto } from "@app/common-dto/search-response.dto";
import { DirectionEnum, Models, TimeframeEnum } from "@prisma/client";
import { Contains } from "@app/tools/contains.decorator";
import { DateMinMaxFilterDto } from "@app/common-dto/min-max.filter.dto";
import { SortDtoGenerator } from "@app/common-dto/sort-generate.dto";
import { TickerResponseDto } from "../../tickers/dto/response.dto";

class Ticker extends OmitType(TickerResponseDto, ["processCount"]) {}

export class TickerResultsResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    tickersId: number;

    @ApiProperty({ enum: TimeframeEnum })
    timeframe: TimeframeEnum;

    @ApiProperty({ enum: DirectionEnum })
    direction: DirectionEnum;

    @ApiProperty({ required: false, type: Number })
    leverage?: number | null;

    @ApiProperty({ required: false, type: Number })
    stopLoss?: number | null;

    @ApiProperty({ required: false, type: Number })
    takeProfit?: number | null;

    @ApiProperty()
    currentPrice: number;

    @ApiProperty()
    predictedPrice: number;

    @ApiProperty({ required: false, type: Number })
    realPrice?: number | null;

    @ApiProperty({ required: false, type: Number })
    difference?: number | null;

    @ApiProperty({ required: false, type: Number })
    leverageDifference?: number | null;

    @ApiProperty({ required: false, type: Number })
    percentDifference?: number | null;

    @ApiProperty()
    isClosed: boolean;

    @ApiProperty({ required: false, type: Date })
    closedAt?: Date | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ type: Ticker })
    @ValidateNested()
    @Type(() => Ticker)
    ticker: Ticker;
}

export class FiltersTickerResultsDto extends PartialType(
    OmitType(TickerResultsResponseDto, ["id", "tickersId", "createdAt", "closedAt", "ticker", "timeframe", "direction"])
) {
    @ApiProperty({ type: DateMinMaxFilterDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DateMinMaxFilterDto)
    closedAt?: DateMinMaxFilterDto;

    @ApiProperty({ enum: TimeframeEnum })
    @IsOptional()
    @Contains()
    timeframe?: TimeframeEnum;

    @ApiProperty({ enum: DirectionEnum })
    @IsOptional()
    @Contains()
    direction?: DirectionEnum;

    @ApiProperty({ enum: Models })
    @IsOptional()
    @Contains()
    model?: Models;

    @ApiProperty({ type: Number, isArray: true })
    @IsOptional()
    @IsNumber({}, { each: true })
    tickersIds?: number[];
}
export class SortsTickerResultsDto extends SortDtoGenerator({
    itemClass: TickerResultsResponseDto,
    includedValue: [
        "percentDifference",
        "difference",
        "percentDifference",
        "direction",
        "isClosed",
        "closedAt",
        "createdAt"
    ]
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

export class TickerResultsSearchResponseDto extends CommonSearchResponseDto(TickerResultsResponseDto) {}
