import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TickersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getAll() {
        return this.prisma.tickers.findMany({
            include: {
                _count: {
                    select: {
                        tickerProcessing: true
                    }
                }
            }
        });
    }

    async findOneById(tickersId: number) {
        return this.prisma.tickers.findFirst({
            where: {
                id: tickersId
            },
            include: {
                _count: {
                    select: {
                        tickerProcessing: true
                    }
                }
            }
        });
    }
}
