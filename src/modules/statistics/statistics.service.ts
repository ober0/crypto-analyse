import { Injectable } from "@nestjs/common";
import { StatisticsRepository } from "./statistics.repository";
import { StatisticsRequestDto } from "./dto/request";
import { PrismaResponse } from "./dto/prisma-response";
import { StatisticsResponseDto } from "./dto/response";

@Injectable()
export class StatisticsService {
    constructor(private readonly repository: StatisticsRepository) {}

    async getStatistics(data: StatisticsRequestDto): Promise<StatisticsResponseDto[]> {
        const response = await this.repository.getStatistics(data);

        return this.transformResponse(response);
    }

    private transformResponse(response: PrismaResponse[]): StatisticsResponseDto[] {
        return response.map((row) => {
            return {
                data: {
                    avg: {
                        pnl: Number(row._avg.pnl?.toFixed(2)),
                        unrealizedPnl: Number(row._avg.unrealizedPnl?.toFixed(2)),
                        leverage: Number(row._avg.leverage?.toFixed(1)),
                        difference: Number(row._avg.difference?.toFixed(4)),
                        unrealizedDifference: Number(row._avg.unrealizedDifference?.toFixed(4))
                    },
                    count: row._count._all,
                    sum: {
                        difference: Number(row._sum.difference?.toFixed(4)),
                        unrealizedDifference: Number(row._sum.unrealizedDifference?.toFixed(4))
                    }
                },
                groupBy: {
                    model: row.model,
                    timeframe: row.timeframe,
                    tickerId: row.tickerId
                }
            };
        });
    }
}
