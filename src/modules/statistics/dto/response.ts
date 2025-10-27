import { ApiProperty } from "@nestjs/swagger";
import { Models, TimeframeEnum } from "@prisma/client";
import { TickerResponseDto } from "../../tickers/dto/response.dto";
import { Validate, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class AvgDto {
    @ApiProperty({ type: Number })
    pnl: number | null;

    @ApiProperty({ type: Number })
    unrealizedPnl: number | null;

    @ApiProperty({ type: Number })
    leverage: number | null;

    @ApiProperty({ type: Number })
    difference: number | null;

    @ApiProperty({ type: Number })
    unrealizedDifference: number | null;
}

class SumDto {
    @ApiProperty({ type: Number })
    difference: number | null;

    @ApiProperty({ type: Number })
    unrealizedDifference: number | null;
}

class DataDto {
    @ApiProperty({ type: AvgDto })
    avg: AvgDto;

    @ApiProperty({ type: Number })
    count: number | null;

    @ApiProperty({ type: SumDto })
    sum: SumDto;
}

class GroupByDto {
    @ApiProperty({ enum: Models, required: false })
    model?: Models;

    @ApiProperty({ enum: TimeframeEnum, required: false })
    timeframe?: TimeframeEnum;

    @ApiProperty({ required: false })
    tickerId?: number;

    @ApiProperty({ type: TickerResponseDto, required: false })
    @ValidateNested()
    @Type(() => TickerResponseDto)
    ticker?: TickerResponseDto;
}

export class StatisticsResponseDto {
    @ApiProperty({ type: DataDto })
    data: DataDto;

    @ApiProperty({ type: GroupByDto })
    groupBy: GroupByDto;
}
