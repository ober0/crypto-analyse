import { Injectable } from "@nestjs/common";
import { TickerResultsRepository } from "./ticker-results.repository";
import { CreateTickerProcessingDto, TickerResultsResponse, UpdateTickerProcessingDto } from "./types";

@Injectable()
export class TickerResultsService {
    constructor(private readonly repository: TickerResultsRepository) {}

    async create(dto: CreateTickerProcessingDto): Promise<TickerResultsResponse> {
        return this.repository.create(dto);
    }

    async update(id: number, dto: UpdateTickerProcessingDto): Promise<TickerResultsResponse> {
        return this.repository.update(id, dto);
    }
}
