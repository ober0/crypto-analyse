import { Injectable } from "@nestjs/common";
import { StatisticsRepository } from "./statistics.repository";
import { StatisticsRequestDto } from "./dto/request";
import { PrismaResponse } from "./dto/prisma-response";
import { StatisticsResponseDto } from "./dto/response";
import { TickerResponseDto } from "../tickers/dto/response.dto";
import { TickersService } from "../tickers/tickers.service";

@Injectable()
export class StatisticsService {
    constructor(
        private readonly repository: StatisticsRepository,
        private readonly tickerService: TickersService
    ) {}

    async getStatistics(data: StatisticsRequestDto): Promise<StatisticsResponseDto[]> {
        const response = await this.repository.getStatistics(data);

        return this.transformResponse(response);
    }

    private async transformResponse(response: PrismaResponse[]): Promise<StatisticsResponseDto[]> {
        return Promise.all(
            response.map(async (row) => {
                let ticker: TickerResponseDto | undefined = undefined;

                if (row.tickersId) {
                    const tickerResponse = await this.tickerService.findOneById(row.tickersId);
                    ticker = {
                        id: tickerResponse.id,
                        name: tickerResponse.name,
                        processCount: tickerResponse._count.tickerProcessing
                    };
                }

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
                        tickersId: row.tickersId,
                        ticker
                    }
                };
            })
        );
    }
}
