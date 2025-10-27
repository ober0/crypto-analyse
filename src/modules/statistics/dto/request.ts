import { IsEnum, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Models, TimeframeEnum } from "@prisma/client";
import { DateMinMaxFilterDto } from "@app/common-dto/min-max.filter.dto";
import { Type } from "class-transformer";
import { Contains } from "@app/tools/contains.decorator";

export class StatisticsFilters {
    @ApiProperty()
    @IsOptional()
    @IsNumber()
    tickersId?: number;

    @ApiProperty({ enum: Models })
    @IsOptional()
    @Contains()
    @IsEnum(Models)
    model?: Models;

    @ApiProperty({ enum: TimeframeEnum })
    @IsOptional()
    @Contains()
    @IsEnum(TimeframeEnum)
    timeframe?: TimeframeEnum;

    @ApiProperty({ type: DateMinMaxFilterDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DateMinMaxFilterDto)
    closedAt?: DateMinMaxFilterDto;
}

export class StatisticsRequestDto {
    @ApiProperty({ type: StatisticsFilters })
    @IsOptional()
    @ValidateNested()
    @Type(() => StatisticsFilters)
    filters?: StatisticsFilters;

    @ApiProperty({ enum: ["tickersId", "timeframe", "model"], isArray: true })
    @IsOptional()
    @IsEnum(["tickersId", "timeframe", "model"], { each: true })
    groupBy?: ("tickersId" | "timeframe" | "model")[];
}
