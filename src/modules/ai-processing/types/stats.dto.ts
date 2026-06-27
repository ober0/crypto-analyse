import { ApiProperty } from "@nestjs/swagger";
import { ProcessingStatus } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional } from "class-validator";

export class AiProcessingStatsRequestDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    tickersId?: number;

    @ApiProperty({ enum: ProcessingStatus, required: false })
    @IsOptional()
    @IsEnum(ProcessingStatus)
    status?: ProcessingStatus;
}

export class AiProcessingStatsResponseDto {
    @ApiProperty()
    count: number;

    @ApiProperty({ required: false, type: Number })
    averagePnl: number | null;
}
