import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProcessingStatus } from "@prisma/client";
import { TickersService } from "../tickers/tickers.service";
import { AiProcessingRepository } from "./ai-processing.repository";
import { CreateAiProcessingDto } from "./types/create.dto";
import { AiProcessingResponseDto } from "./types/response.dto";
import { AiProcessingSearchResponseDto, SearchAiProcessingDto } from "./types/search";
import { AiProcessingStatsRequestDto, AiProcessingStatsResponseDto } from "./types/stats.dto";
import { UpdateAiProcessingDto } from "./types/update.dto";

@Injectable()
export class AiProcessingCrudService {
    constructor(
        private readonly repository: AiProcessingRepository,
        private readonly tickersService: TickersService
    ) {}

    async create(userId: number, dto: CreateAiProcessingDto): Promise<AiProcessingResponseDto> {
        await this.tickersService.findOneById(dto.tickersId);

        try {
            return await this.repository.create(userId, dto);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new BadRequestException("На этот тикер с этой моделью бот уже существует");
            }

            throw error;
        }
    }

    async enable(userId: number, id: number): Promise<AiProcessingResponseDto> {
        const item = await this.repository.findById(id);

        if (item.userId !== userId) {
            throw new NotFoundException();
        }

        if (([ProcessingStatus.End, ProcessingStatus.Error] as string[]).includes(item.status)) {
            throw new BadRequestException("Завершённого бота нельзя включить");
        }

        if (item.status === ProcessingStatus.Active || item.status === ProcessingStatus.InOrder) {
            throw new BadRequestException("бот уже включен");
        }

        return this.repository.enable(id, item.interval);
    }

    async disable(userId: number, id: number): Promise<AiProcessingResponseDto> {
        const item = await this.repository.findById(id);

        if (item.status === ProcessingStatus.Ready) {
            throw new BadRequestException("бот не запущен");
        }

        if (([ProcessingStatus.End, ProcessingStatus.Error] as string[]).includes(item.status)) {
            throw new BadRequestException("бот уже завершен");
        }

        return this.repository.disable(id);
    }

    async getStats(dto: AiProcessingStatsRequestDto): Promise<AiProcessingStatsResponseDto> {
        return this.repository.getStats(dto);
    }

    async search(dto: SearchAiProcessingDto): Promise<AiProcessingSearchResponseDto> {
        const [data, count] = await Promise.all([this.repository.search(dto), this.repository.count(dto)]);

        return { data, count };
    }

    async findOne(id: number) {
        return this.repository.findOne(id);
    }

    async delete(userId: number, id: number) {
        const bot = await this.repository.findOne(id);

        if (!bot || bot.userId !== userId) {
            throw new NotFoundException("Бот не найден");
        }

        return this.repository.delete(id);
    }

    async getUsageByModel() {
        return this.repository.getUsageByModel();
    }

    async update(id: number, dto: UpdateAiProcessingDto, userId: number) {
        const exist = await this.repository.findById(id);
        if (!exist || exist.userId !== userId) {
            throw new NotFoundException();
        }

        return this.repository.update(id, dto);
    }
}
