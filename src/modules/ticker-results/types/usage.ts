import { ApiProperty } from "@nestjs/swagger";

export class UsageByModelItemDto {
    @ApiProperty()
    model: string;

    @ApiProperty()
    prompt: number;

    @ApiProperty()
    response: number;

    @ApiProperty()
    total: number;
}
