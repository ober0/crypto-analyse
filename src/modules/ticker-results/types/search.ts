import { SearchBaseDto } from "@app/common-dto/base-search.dto";
import { IsArray, IsNumber, isNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
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

    @ApiProperty()
    difference: number | null;

    @ApiProperty()
    unrealizedDifference: number | null;

    @ApiProperty()
    pnl: number | null;

    @ApiProperty()
    unrealizedPnl: number | null;

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

export class FiltersTickerResultsDto extends PartialType(PickType(TickerResultsResponseDto, ["isClosed"])) {
    @ApiProperty({ type: DateMinMaxFilterDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DateMinMaxFilterDto)
    closedAt?: DateMinMaxFilterDto;

    @ApiProperty({ type: DateMinMaxFilterDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DateMinMaxFilterDto)
    createdAt?: DateMinMaxFilterDto;

    @ApiProperty({ enum: TimeframeEnum })
    @IsOptional()
    @Contains()
    timeframe?: TimeframeEnum;

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
    includedValue: ["pnl", "unrealizedPnl", "closedAt", "createdAt", "isClosed"]
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
