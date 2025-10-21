import { ApiProperty } from "@nestjs/swagger";

export class TickerResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    processCount: number;
}
