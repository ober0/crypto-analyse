import { ApiProperty } from "@nestjs/swagger";
import { Models, TimeframeEnum } from "@prisma/client";

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
}

export class StatisticsResponseDto {
    @ApiProperty({ type: DataDto })
    data: DataDto;

    @ApiProperty({ type: GroupByDto })
    groupBy: GroupByDto;
}
