import { ApiProperty } from "@nestjs/swagger";
import {
    ProcessingInterval,
    ProcessingStatus,
    TradeActionType,
    TradeCloseReason,
    TradeDirection,
    TradeStatus
} from "@prisma/client";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { OmitType } from "@nestjs/swagger";
import { TickerResponseDto } from "../../tickers/dto/response.dto";

class Ticker extends OmitType(TickerResponseDto, ["processCount"]) {}

export class AiProcessingResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    tickersId: number;

    @ApiProperty()
    checkIntervalMins: number;

    @ApiProperty()
    startAt: Date | null;

    @ApiProperty()
    endAt: Date | null;

    @ApiProperty({ enum: ProcessingInterval })
    interval: ProcessingInterval;

    @ApiProperty()
    customPrompt: string | null;

    @ApiProperty()
    withWebSearch: boolean;

    @ApiProperty({ enum: ProcessingStatus })
    status: ProcessingStatus;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ type: Ticker })
    @ValidateNested()
    @Type(() => Ticker)
    ticker: Ticker;
}

export class TradeActionResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    tradeId: number;

    @ApiProperty({ enum: TradeActionType })
    type: TradeActionType;

    @ApiProperty({ required: false, type: Number })
    quantity?: number | null;

    @ApiProperty({ required: false, type: Number })
    price?: number | null;

    @ApiProperty({ required: false, type: Number })
    stopLoss?: number | null;

    @ApiProperty({ required: false, type: Number })
    takeProfit?: number | null;

    @ApiProperty({ required: false, type: Number })
    realizedPnl?: number | null;

    @ApiProperty({ required: false, type: String })
    comment?: string | null;

    @ApiProperty()
    createdAt: Date;
}

export class TradeResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    tickerId: number;

    @ApiProperty({ enum: TradeDirection })
    direction: TradeDirection;

    @ApiProperty({ enum: TradeStatus })
    status: TradeStatus;

    @ApiProperty()
    currentSize: number;

    @ApiProperty()
    averageEntryPrice: number;

    @ApiProperty({ required: false, type: Number })
    stopLoss?: number | null;

    @ApiProperty({ required: false, type: Number })
    takeProfit?: number | null;

    @ApiProperty({ required: false, type: Number })
    pnl?: number | null;

    @ApiProperty({ required: false, enum: TradeCloseReason })
    closeReason?: TradeCloseReason | null;

    @ApiProperty()
    openedAt: Date;

    @ApiProperty({ required: false, type: Date })
    closedAt?: Date | null;

    @ApiProperty({ required: false, type: String })
    openDescription?: string | null;

    @ApiProperty({ required: false, type: String })
    closeDescription?: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: TradeActionResponseDto, isArray: true })
    @ValidateNested({ each: true })
    @Type(() => TradeActionResponseDto)
    actions: TradeActionResponseDto[];
}

export class AiProcessingDetailResponseDto extends AiProcessingResponseDto {
    @ApiProperty({ type: TradeResponseDto, isArray: true })
    @ValidateNested({ each: true })
    @Type(() => TradeResponseDto)
    trades: TradeResponseDto[];
}
