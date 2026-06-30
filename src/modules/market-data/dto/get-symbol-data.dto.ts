import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNumber, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export const intervals = ["1", "15", "60", "D", "W"] as const;
export type Interval = (typeof intervals)[number];

export class GetSymbolDataDto {
    symbol: string;
    candles: number;
    interval: Interval;
}

export class GetMarketDataDto {
    @ApiProperty()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    candles: number;

    @ApiProperty({ enum: intervals })
    @IsIn(intervals)
    interval: Interval;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    page: number;
}

export function intervalToMs(interval: Interval): number {
    switch (interval) {
        case "1":
            return 60_000;
        case "15":
            return 15 * 60_000;
        case "60":
            return 60 * 60_000;
        case "D":
            return 24 * 60 * 60_000;
        case "W":
            return 7 * 24 * 60 * 60_000;
    }
}
