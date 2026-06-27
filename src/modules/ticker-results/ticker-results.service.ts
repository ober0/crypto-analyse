import { Injectable } from "@nestjs/common";
import { TickerResultsRepository } from "./ticker-results.repository";
import { CreateTickerProcessingDto, TickerResultsResponse, UpdateTickerProcessingDto } from "./types";
import { SearchTickerResultsDto, TickerResultsResponseDto, TickerResultsSearchResponseDto } from "./types/search";
import { Prisma } from "@prisma/client";

@Injectable()
export class TickerResultsService {
    constructor(private readonly repository: TickerResultsRepository) {}

    async create(dto: CreateTickerProcessingDto): Promise<TickerResultsResponse> {
        return this.repository.create(dto);
    }

    async update(id: number, dto: UpdateTickerProcessingDto): Promise<TickerResultsResponse> {
        return this.repository.update(id, dto);
    }

    async search(dto: SearchTickerResultsDto): Promise<TickerResultsSearchResponseDto> {
        const [data, count] = await Promise.all([this.repository.search(dto), this.repository.count(dto)]);

        return {
            data,
            count
        };
    }

    async findAllByWhere(where: Prisma.TickerProcessingWhereInput): Promise<TickerResultsResponse[]> {
        return this.repository.findAllByWhere(where);
    }

    async getUsageByModel() {
        return this.repository.getUsageByModel();
    }
}
