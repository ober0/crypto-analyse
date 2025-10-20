import {ApiProperty} from "@nestjs/swagger";
import {RoleNames} from "@prisma/client";

export class RoleBaseDto {
    @ApiProperty()
    id: number;

    @ApiProperty({enum: RoleNames})
    name: RoleNames;
}