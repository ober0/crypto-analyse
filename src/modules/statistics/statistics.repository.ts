import { Injectable } from "@nestjs/common";
import { StatisticsRequestDto } from "./dto/request";
import { PrismaService } from "../prisma/prisma.service";
import { mapSearch } from "@app/tools/map.search";
import { PrismaResponse } from "./dto/prisma-response";

@Injectable()
export class StatisticsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getStatistics(data: StatisticsRequestDto): Promise<PrismaResponse[]> {
        const filters = mapSearch(data.filters);

        if (!data.groupBy || data.groupBy.length === 0) {
            const res = await this.prisma.tickerProcessing.aggregate({
                where: filters,
                _avg: {
                    pnl: true,
                    unrealizedPnl: true,
                    leverage: true,
                    difference: true,
                    unrealizedDifference: true
                },
                _count: {
                    _all: true
                },
                _sum: {
                    difference: true,
                    unrealizedDifference: true
                }
            });
            return [res];
        }

        return this.prisma.tickerProcessing.groupBy({
            by: data.groupBy,
            where: filters,
            _avg: {
                pnl: true,
                unrealizedPnl: true,
                leverage: true,
                difference: true,
                unrealizedDifference: true
            },
            _count: { _all: true },
            _sum: {
                difference: true,
                unrealizedDifference: true
            }
        }) as unknown as PrismaResponse[];
    }
}
