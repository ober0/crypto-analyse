import { Injectable, NotFoundException } from "@nestjs/common";
import {
    Prisma,
    ProcessingInterval,
    ProcessingStatus,
    Models,
    TradeCloseReason,
    TradeStatus,
    TradeActionType,
    ProcessingLogsEnum
} from "@prisma/client";
import { mapPagination } from "@app/tools/map.pagination";
import { mapSearch } from "@app/tools/map.search";
import { mapSort } from "@app/tools/map.sort";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAiProcessingDto } from "./types/create.dto";
import { AiProcessingStatsRequestDto } from "./types/stats.dto";
import { FiltersAiProcessingDto, SearchAiProcessingDto } from "./types/search";
import { z } from "zod";
import { tradeSchema } from "../ai/response-schemas/open-trade";
import { TokenUsage } from "../ai/types/token-usage.type";

const ACTIVE_STATUSES: ProcessingStatus[] = [ProcessingStatus.Ready, ProcessingStatus.Active, ProcessingStatus.InOrder];

@Injectable()
export class AiProcessingRepository {
    constructor(private readonly prisma: PrismaService) {}

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
                ticker: true,
                logs: true
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
        const mapped = mapSearch(
            rest,
            [],
            ["statuses", "status", "model", "interval"]
        ) as Prisma.AiProcessingWhereInput;

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

    async getAllActiveTrades() {
        return this.prisma.trade.findMany({
            where: {
                status: "Open"
            }
        });
    }

    async updateTrade(id: number, data: { price: number; pnl: number }) {
        await this.prisma.trade.update({
            where: {
                id
            },
            data: {
                currentPrice: data.price,
                pnl: data.pnl
            }
        });
    }

    async getAllActiveBots() {
        return this.prisma.aiProcessing.findMany({
            where: {
                status: ProcessingStatus.Active
            },
            include: {
                trades: true
            }
        });
    }

    async passTrade(botId: number, description: string) {
        return this.prisma.processingLogs.create({
            data: {
                type: ProcessingLogsEnum.TradePass,
                text: description,
                aiProcessingId: botId
            }
        });
    }

    async createBotUsage(botId: number, usage: TokenUsage, model: Models) {
        return this.prisma.usage.create({
            data: {
                aiProcessingId: botId,
                prompt: usage.prompt_tokens,
                response: usage.completion_tokens,
                model
            }
        });
    }

    async getAllActiveTradesWithRelations() {
        return this.prisma.trade.findMany({
            where: {
                status: "Open"
            },
            include: {
                aiProcessing: true,
                actions: true
            }
        });
    }

    async updateCheck(id: number, last: Date, next: Date) {
        await this.prisma.aiProcessing.update({
            where: {
                id
            },
            data: {
                lastCheckAt: last,
                nextCheckAt: next
            }
        });
    }

    async closeTrade(
        id: number,
        data: { closeReason: TradeCloseReason; description: string; size: number; price: number; pnl?: number }
    ) {
        await this.prisma.trade.update({
            where: {
                id
            },
            data: {
                aiProcessing: {
                    update: {
                        status: "Active",
                        logs: {
                            create: {
                                type: ProcessingLogsEnum.TradeClose,
                                text: data.description
                            }
                        }
                    }
                },
                closeReason: data.closeReason,
                closeDescription: data.description,
                status: TradeStatus.Closed,
                pnl: data.pnl,
                actions: {
                    create: {
                        type: TradeActionType.Sell,
                        comment: data.description,
                        price: data.price,
                        quantity: data.size
                    }
                }
            }
        });
    }

    async createTrade(
        botId: number,
        trade: z.infer<typeof tradeSchema>,
        description: string,
        tickerId: number,
        price: number
    ) {
        return this.prisma.aiProcessing.update({
            where: {
                id: botId
            },
            data: {
                status: "InOrder",
                logs: {
                    create: {
                        type: ProcessingLogsEnum.TradeOpen,
                        text: description
                    }
                },
                trades: {
                    create: {
                        openDescription: description,
                        averageEntryPrice: price,
                        currentPrice: price,
                        currentSize: trade.size,
                        tickerId: tickerId,
                        direction: trade.direction,
                        stopLoss: trade.stopLoss,
                        takeProfit: trade.takeProfit,
                        confidence: trade.confidence,
                        mainTimeframe: trade.timeframe,
                        invalidationLevel: trade.invalidationLevel,
                        liquidityZone: trade.liquidityZone,
                        status: "Open",
                        actions: {
                            create: {
                                type: TradeActionType.Open,
                                quantity: trade.size,
                                price,
                                stopLoss: trade.stopLoss,
                                takeProfit: trade.takeProfit,
                                comment: trade.reasoning
                            }
                        }
                    }
                }
            }
        });
    }

    async addTrade(
        id: number,
        data: { description: string; size: number; newSize: number; price: number; avgPrice: number }
    ) {
        return this.prisma.trade.update({
            where: {
                id
            },
            data: {
                currentPrice: data.price,
                averageEntryPrice: data.avgPrice,
                currentSize: data.size,
                aiProcessing: {
                    update: {
                        status: "InOrder",
                        logs: {
                            create: {
                                type: ProcessingLogsEnum.TradeActive,
                                text: data.description
                            }
                        }
                    }
                },
                actions: {
                    create: {
                        type: TradeActionType.Buy,
                        quantity: data.newSize,
                        price: data.price,
                        comment: data.description
                    }
                }
            }
        });
    }

    async partialSellTrade(id: number, data: { description: string; size: number; newSize: number; price: number }) {
        return this.prisma.trade.update({
            where: {
                id
            },
            data: {
                currentPrice: data.price,
                currentSize: data.size,
                aiProcessing: {
                    update: {
                        status: "InOrder",
                        logs: {
                            create: {
                                type: ProcessingLogsEnum.TradeActive,
                                text: data.description
                            }
                        }
                    }
                },
                actions: {
                    create: {
                        type: TradeActionType.PartialSell,
                        quantity: data.newSize,
                        price: data.price,
                        comment: data.description
                    }
                }
            }
        });
    }

    async updateSlTp(id: number, newTP: number, newSL: number, oldTP: number, oldSL: number) {
        return this.prisma.trade.update({
            where: {
                id
            },
            data: {
                takeProfit: newTP,
                stopLoss: newSL,
                actions: {
                    create: {
                        type: TradeActionType.Change_sl_tp,
                        stopLoss: newSL,
                        oldStopLoss: oldSL,
                        takeProfit: newTP,
                        oldTakeProfit: oldTP
                    }
                }
            }
        });
    }

    async getUsageByModel() {
        const data = await this.prisma.usage.groupBy({
            where: {
                aiProcessing: {
                    isNot: null
                }
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
