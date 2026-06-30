import { ApiProperty } from "@nestjs/swagger";
import { Models, ProcessingInterval } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateAiProcessingDto {
    @ApiProperty()
    @IsOptional()
    @IsNumber()
    @Min(5)
    @Max(60 * 24)
    checkIntervalMins?: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    customPrompt?: string;

    @ApiProperty({ default: true, required: false })
    @IsOptional()
    @IsBoolean()
    withWebSearch?: boolean;
}
