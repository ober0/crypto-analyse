import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ProcessingStatus } from "@prisma/client";
import { TickersService } from "../tickers/tickers.service";
import { AiProcessingRepository } from "./ai-processing.repository";
import { CreateAiProcessingDto } from "./types/create.dto";
import { AiProcessingResponseDto } from "./types/response.dto";
import { AiProcessingSearchResponseDto, SearchAiProcessingDto } from "./types/search";
import { AiProcessingStatsRequestDto, AiProcessingStatsResponseDto } from "./types/stats.dto";

@Injectable()
export class AiProcessingCrudService {
    constructor(
        private readonly repository: AiProcessingRepository,
        private readonly tickersService: TickersService
    ) {}

    async create(userId: number, dto: CreateAiProcessingDto): Promise<AiProcessingResponseDto> {
        await this.tickersService.findOneById(dto.tickersId);

        const existing = await this.repository.findActiveByUserAndTicker(userId, dto.tickersId);
        if (existing) {
            throw new BadRequestException("На этот тикер уже есть активный бот");
        }

        return this.repository.create(userId, dto);
    }

    async enable(userId: number, id: number): Promise<AiProcessingResponseDto> {
        const item = await this.repository.findByIdForUser(id, userId);

        if (([ProcessingStatus.End, ProcessingStatus.Error] as string[]).includes(item.status)) {
            throw new BadRequestException("Завершённого бота нельзя включить");
        }

        if (item.status === ProcessingStatus.Active || item.status === ProcessingStatus.InOrder) {
            throw new BadRequestException("бот уже включен");
        }

        const conflicting = await this.repository.findActiveByUserAndTicker(userId, item.tickersId, id);
        if (conflicting) {
            throw new BadRequestException("На этот тикер уже есть активный бот");
        }

        return this.repository.enable(id, item.interval);
    }

    async disable(userId: number, id: number): Promise<AiProcessingResponseDto> {
        const item = await this.repository.findByIdForUser(id, userId);

        if (item.status === ProcessingStatus.Ready) {
            throw new BadRequestException("бот не запущен");
        }

        if (([ProcessingStatus.End, ProcessingStatus.Error] as string[]).includes(item.status)) {
            throw new BadRequestException("бот уже завершен");
        }

        return this.repository.disable(id);
    }

    async getStats(userId: number, dto: AiProcessingStatsRequestDto): Promise<AiProcessingStatsResponseDto> {
        return this.repository.getStats(userId, dto);
    }

    async search(userId: number, dto: SearchAiProcessingDto): Promise<AiProcessingSearchResponseDto> {
        const [data, count] = await Promise.all([
            this.repository.search(userId, dto),
            this.repository.count(userId, dto)
        ]);

        return { data, count };
    }

    async findOne(userId: number, id: number) {
        return this.repository.findOne(id, userId);
    }

    async delete(userId: number, id: number) {
        const bot = await this.repository.findOne(id, userId);

        if (!bot) {
            throw new NotFoundException("Бот не найден");
        }

        return this.repository.delete(id);
    }
}
