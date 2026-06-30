import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTickerProcessingDto, TickerResultsResponse, UpdateTickerProcessingDto } from "./types";
import { PrismaService } from "../prisma/prisma.service";
import { SearchTickerResultsDto, TickerResultsResponseDto } from "./types/search";
import { Prisma, UsageType } from "@prisma/client";
import { mapSearch } from "@app/tools/map.search";
import { mapSort } from "@app/tools/map.sort";
import { mapPagination } from "@app/tools/map.pagination";

@Injectable()
export class TickerResultsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateTickerProcessingDto): Promise<TickerResultsResponse> {
        return this.prisma.$transaction(async (tx) => {
            const usage = await tx.usage.create({
                data: {
                    type: UsageType.TickerProcessing,
                    model: data.model,
                    prompt: data.usage.promptTokens ?? 0,
                    response: data.usage.completionTokens ?? 0
                }
            });

            return tx.tickerProcessing.create({
                data: {
                    tickersId: data.tickerId,
                    timeframe: data.timeframe,
                    direction: data.direction,
                    leverage: data.leverage,
                    stopLoss: data.stopLoss,
                    takeProfit: data.takeProfit,
                    currentPrice: data.currentPrice,
                    predictedPrice: data.predictedPrice,
                    model: data.model,
                    closedAt: data.closedAt,
                    usageId: usage.id
                },
                include: {
                    ticker: true,
                    usage: true
                }
            });
        });
    }

    async update(id: number, data: UpdateTickerProcessingDto): Promise<TickerResultsResponse> {
        await this.checkExists(id);
        return this.prisma.tickerProcessing.update({
            where: { id },
            data,
            include: {
                ticker: true,
                usage: true
            }
        });
    }

    async checkExists(id: number): Promise<void> {
        const exists = await this.prisma.tickerProcessing.findUnique({ where: { id } });
        if (!exists) {
            throw new NotFoundException(`TickerProcessing with id ${id} not found`);
        }
    }

    buildWhere(dto: SearchTickerResultsDto): Prisma.TickerProcessingWhereInput {
        return mapSearch(dto.filters);
    }

    async search(dto: SearchTickerResultsDto): Promise<TickerResultsResponseDto[]> {
        return this.prisma.tickerProcessing.findMany({
            where: this.buildWhere(dto),
            orderBy: mapSort(dto.sorts),
            ...mapPagination(dto.pagination),
            include: {
                ticker: true,
                usage: true
            }
        });
    }

    async count(dto: SearchTickerResultsDto): Promise<number> {
        return this.prisma.tickerProcessing.count({
            where: this.buildWhere(dto)
        });
    }

    async findAllByWhere(where: Prisma.TickerProcessingWhereInput): Promise<TickerResultsResponse[]> {
        return this.prisma.tickerProcessing.findMany({
            where,
            include: {
                ticker: true,
                usage: true
            }
        });
    }
    async getUsageByModel() {
        const data = await this.prisma.usage.groupBy({
            where: {
                OR: [
                    {
                        type: UsageType.TickerProcessing
                    },
                    {
                        tickerProcessing: {
                            isNot: null
                        }
                    }
                ]
            },
            by: ["model"],
            _sum: {
                prompt: true,
                response: true
            }
        });

        return data.map((x) => ({
            model: x.model,
            prompt: x._sum.prompt ?? 0,
            response: x._sum.response ?? 0,
            total: (x._sum.prompt ?? 0) + (x._sum.response ?? 0)
        }));
    }
}
