import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTickerProcessingDto, TickerResultsResponse, UpdateTickerProcessingDto } from "./types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TickerResultsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateTickerProcessingDto): Promise<TickerResultsResponse> {
        return this.prisma.tickerProcessing.create({
            data: {
                tickersId: data.tickerId,
                timeframe: data.timeframe,
                direction: data.direction,
                leverage: data.leverage,
                stopLoss: data.stopLoss,
                takeProfit: data.takeProfit,
                currentPrice: data.currentPrice,
                predictedPrice: data.predictedPrice
            },
            include: {
                ticker: true
            }
        });
    }

    async update(id: number, data: UpdateTickerProcessingDto): Promise<TickerResultsResponse> {
        await this.checkExists(id);
        return this.prisma.tickerProcessing.update({
            where: { id },
            data,
            include: {
                ticker: true
            }
        });
    }

    async checkExists(id: number): Promise<void> {
        const exists = await this.prisma.tickerProcessing.findUnique({ where: { id } });
        if (!exists) {
            throw new NotFoundException(`TickerProcessing with id ${id} not found`);
        }
    }
}
