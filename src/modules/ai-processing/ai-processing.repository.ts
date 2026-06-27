import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProcessingInterval, ProcessingStatus, Models } from "@prisma/client";
import { mapPagination } from "@app/tools/map.pagination";
import { mapSearch } from "@app/tools/map.search";
import { mapSort } from "@app/tools/map.sort";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAiProcessingDto } from "./types/create.dto";
import { AiProcessingStatsRequestDto } from "./types/stats.dto";
import { FiltersAiProcessingDto, SearchAiProcessingDto } from "./types/search";

const ACTIVE_STATUSES: ProcessingStatus[] = [ProcessingStatus.Ready, ProcessingStatus.Active, ProcessingStatus.InOrder];

@Injectable()
export class AiProcessingRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findActiveByUserTickerAndModel(
        userId: number,
        tickersId: number,
        model: Models,
        excludeId?: number
    ) {
        return this.prisma.aiProcessing.findFirst({
            where: {
                userId,
                tickersId,
                model,
                status: { in: ACTIVE_STATUSES },
                ...(excludeId ? { id: { not: excludeId } } : {})
            }
        });
    }

    async create(userId: number, dto: CreateAiProcessingDto) {
        return this.prisma.aiProcessing.create({
            data: {
                userId,
                tickersId: dto.tickersId,
                model: dto.model,
                checkIntervalMins: dto.checkIntervalMins,
                interval: dto.interval,
                customPrompt: dto.customPrompt,
                withWebSearch: dto.withWebSearch ?? true,
                status: ProcessingStatus.Ready,
                createdAt: new Date()
            },
            include: {
                ticker: true
            }
        });
    }

    async findByIdForUser(id: number, userId: number) {
        const item = await this.prisma.aiProcessing.findFirst({
            where: { id, userId },
            include: {
                ticker: true
            }
        });

        if (!item) {
            throw new NotFoundException(`AiProcessing with id ${id} not found`);
        }

        return item;
    }

    async findOne(id: number, userId: number) {
        const item = await this.findByIdForUser(id, userId);

        const trades = await this.prisma.trade.findMany({
            where: { aiProcessingId: item.id },
            include: {
                actions: {
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { openedAt: "asc" }
        });

        return { ...item, trades };
    }

    async enable(id: number, interval: ProcessingInterval) {
        return this.prisma.aiProcessing.update({
            where: { id },
            data: {
                status: ProcessingStatus.Active,
                startAt: new Date(),
                endAt: new Date(
                    Date.now() +
                        1000 *
                            60 *
                            60 *
                            24 *
                            (interval === ProcessingInterval.OneWeek
                                ? 7
                                : interval === ProcessingInterval.OneMonth
                                  ? 30
                                  : 1)
                )
            },
            include: {
                ticker: true
            }
        });
    }

    async disable(id: number) {
        return this.prisma.aiProcessing.update({
            where: { id },
            data: {
                status: ProcessingStatus.End,
                endAt: new Date(),
                trades: {
                    updateMany: {
                        where: {
                            status: "Open"
                        },
                        data: {
                            status: "Closed",
                            closeReason: "BotDisable"
                        }
                    }
                }
            },
            include: {
                ticker: true
            }
        });
    }

    buildWhere(userId: number, filters?: FiltersAiProcessingDto): Prisma.AiProcessingWhereInput {
        if (!filters) {
            return { userId };
        }

        const { statuses, status, model, interval, ...rest } = filters;
        const mapped = mapSearch(rest, [], ["statuses", "status", "model", "interval"]) as Prisma.AiProcessingWhereInput;

        if (statuses?.length) {
            mapped.status = { in: statuses };
        } else if (status) {
            mapped.status = status;
        }

        if (model) {
            mapped.model = model;
        }

        if (interval) {
            mapped.interval = interval;
        }

        return { userId, ...mapped };
    }

    async getStats(userId: number, dto: AiProcessingStatsRequestDto) {
        const where: Prisma.AiProcessingWhereInput = {
            userId,
            ...(dto.tickersId ? { tickersId: dto.tickersId } : {}),
            ...(dto.status ? { status: dto.status } : {})
        };

        const [count, processings] = await Promise.all([
            this.prisma.aiProcessing.count({ where }),
            this.prisma.aiProcessing.findMany({
                where,
                select: { id: true }
            })
        ]);

        if (!processings.length) {
            return { count, averagePnl: null };
        }

        const aggregate = await this.prisma.trade.aggregate({
            where: { aiProcessingId: { in: processings.map((item) => item.id) } },
            _avg: { pnl: true }
        });

        return {
            count,
            averagePnl: aggregate._avg.pnl != null ? Number(aggregate._avg.pnl) : null
        };
    }

    async search(userId: number, dto: SearchAiProcessingDto) {
        const items = await this.prisma.aiProcessing.findMany({
            where: this.buildWhere(userId, dto.filters),
            orderBy: mapSort(dto.sorts),
            ...mapPagination(dto.pagination),
            include: {
                ticker: true
            }
        });

        if (!items.length) {
            return [];
        }

        const processingIds = items.map((item) => item.id);
        const trades = await this.prisma.trade.findMany({
            where: { aiProcessingId: { in: processingIds } },
            select: {
                aiProcessingId: true,
                pnl: true,
                averageEntryPrice: true,
                currentSize: true
            }
        });

        const statsByProcessingId = new Map<
            number,
            {
                count: number;
                totalPnl: number;
                pnlCount: number;
                totalInvested: number;
                percentSum: number;
                percentCount: number;
            }
        >();

        for (const trade of trades) {
            const stat = statsByProcessingId.get(trade.aiProcessingId) ?? {
                count: 0,
                totalPnl: 0,
                pnlCount: 0,
                totalInvested: 0,
                percentSum: 0,
                percentCount: 0
            };

            stat.count++;
            const invested = Number(trade.averageEntryPrice) * Number(trade.currentSize);
            stat.totalInvested += invested;

            if (trade.pnl != null) {
                stat.totalPnl += Number(trade.pnl);
                stat.pnlCount++;

                if (invested > 0) {
                    stat.percentSum += (Number(trade.pnl) / invested) * 100;
                    stat.percentCount++;
                }
            }

            statsByProcessingId.set(trade.aiProcessingId, stat);
        }

        return items.map((item) => {
            const stat = statsByProcessingId.get(item.id);

            return {
                ...item,
                tradesCount: stat?.count ?? 0,
                averagePnl: stat?.pnlCount ? stat.totalPnl / stat.pnlCount : null,
                totalPnl: stat?.pnlCount ? stat.totalPnl : null,
                averagePnlPercent: stat?.percentCount ? stat.percentSum / stat.percentCount : null,
                totalPnlPercent: stat?.totalInvested ? (stat.totalPnl / stat.totalInvested) * 100 : null
            };
        });
    }

    async count(userId: number, dto: SearchAiProcessingDto): Promise<number> {
        return this.prisma.aiProcessing.count({
            where: this.buildWhere(userId, dto.filters)
        });
    }

    async delete(id: number) {
        return this.prisma.aiProcessing.delete({
            where: { id }
        });
    }
}

export { ACTIVE_STATUSES };
