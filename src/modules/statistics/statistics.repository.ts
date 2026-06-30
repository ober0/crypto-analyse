import { Injectable } from "@nestjs/common";
import { StatisticsRequestDto } from "./dto/request";
import { PrismaService } from "../prisma/prisma.service";
import { mapSearch } from "@app/tools/map.search";
import { PrismaResponse } from "./dto/prisma-response";
import { Models, TimeframeEnum } from "@prisma/client";

const NORMALIZE_BASE = 1000;

type StatRecord = {
    model: Models;
    timeframe: TimeframeEnum;
    tickersId: number;
    currentPrice: number;
    difference: number | null;
    unrealizedDifference: number | null;
    pnl: number | null;
    unrealizedPnl: number | null;
    leverage: number | null;
};

@Injectable()
export class StatisticsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getStatistics(data: StatisticsRequestDto): Promise<PrismaResponse[]> {
        const filters = mapSearch(data.filters);
        const records = await this.prisma.tickerProcessing.findMany({
            where: filters,
            select: {
                model: true,
                timeframe: true,
                tickersId: true,
                currentPrice: true,
                difference: true,
                unrealizedDifference: true,
                pnl: true,
                unrealizedPnl: true,
                leverage: true
            }
        });

        if (!data.groupBy?.length) {
            return [this.aggregateRecords(records)];
        }

        const groups = new Map<string, StatRecord[]>();

        for (const record of records) {
            const key = data.groupBy.map((field) => record[field]).join("|");
            const group = groups.get(key) ?? [];
            group.push(record);
            groups.set(key, group);
        }

        return [...groups.entries()].map(([, groupRecords]) => {
            const result = this.aggregateRecords(groupRecords);

            for (const field of data.groupBy!) {
                if (field === "tickersId") {
                    result.tickersId = groupRecords[0].tickersId;
                }
                if (field === "model") {
                    result.model = groupRecords[0].model;
                }
                if (field === "timeframe") {
                    result.timeframe = groupRecords[0].timeframe;
                }
            }

            return result;
        });
    }

    private normalizeDifference(value: number | null, currentPrice: number): number | null {
        if (value == null || !currentPrice) {
            return null;
        }

        return (value / currentPrice) * NORMALIZE_BASE;
    }

    private aggregateRecords(records: StatRecord[]): PrismaResponse {
        let sumPnl = 0;
        let countPnl = 0;
        let sumUnrealizedPnl = 0;
        let countUnrealizedPnl = 0;
        let sumLeverage = 0;
        let countLeverage = 0;
        let sumDifference = 0;
        let countDifference = 0;
        let sumUnrealizedDifference = 0;
        let countUnrealizedDifference = 0;

        for (const record of records) {
            const normalizedDifference = this.normalizeDifference(record.difference, record.currentPrice);
            const normalizedUnrealizedDifference = this.normalizeDifference(
                record.unrealizedDifference,
                record.currentPrice
            );

            if (normalizedDifference != null) {
                sumDifference += normalizedDifference;
                countDifference++;
            }

            if (normalizedUnrealizedDifference != null) {
                sumUnrealizedDifference += normalizedUnrealizedDifference;
                countUnrealizedDifference++;
            }

            if (record.pnl != null) {
                sumPnl += record.pnl;
                countPnl++;
            }

            if (record.unrealizedPnl != null) {
                sumUnrealizedPnl += record.unrealizedPnl;
                countUnrealizedPnl++;
            }

            if (record.leverage != null) {
                sumLeverage += record.leverage;
                countLeverage++;
            }
        }

        return {
            _avg: {
                pnl: countPnl ? sumPnl / countPnl : null,
                unrealizedPnl: countUnrealizedPnl ? sumUnrealizedPnl / countUnrealizedPnl : null,
                leverage: countLeverage ? sumLeverage / countLeverage : null,
                difference: countDifference ? sumDifference / countDifference : null,
                unrealizedDifference: countUnrealizedDifference ? sumUnrealizedDifference / countUnrealizedDifference : null
            },
            _count: {
                _all: records.length
            },
            _sum: {
                difference: countDifference ? sumDifference : null,
                unrealizedDifference: countUnrealizedDifference ? sumUnrealizedDifference : null
            }
        };
    }
}
