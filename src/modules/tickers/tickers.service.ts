import { Injectable, NotFoundException } from "@nestjs/common";
import { TickersRepository } from "./tickers.repository";
import { TickerResponseDto } from "./dto/response.dto";

@Injectable()
export class TickersService {
    constructor(private readonly repository: TickersRepository) {}

    async getAll(): Promise<TickerResponseDto[]> {
        const response = await this.repository.getAll();

        return response.map((el) => {
            return {
                id: el.id,
                name: el.name,
                processCount: el._count.tickerProcessing as number
            };
        });
    }

    async findOneById(tickersId: number) {
        const data = await this.repository.findOneById(tickersId);
        if (!data) {
            throw new NotFoundException(`Тикер не найден`);
        }

        return data;
    }
}
