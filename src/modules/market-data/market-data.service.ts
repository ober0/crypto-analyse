import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { GetMarketDataDto, GetSymbolDataDto, intervalToMs } from "./dto/get-symbol-data.dto";
import { SymbolDataResponseDto } from "./dto/response.dto";
import { OHLCVKlineV5, RestClientV5 } from "bybit-api";
import { TickersService } from "../tickers/tickers.service";

@Injectable()
export class MarketDataService {
    private readonly logger = new Logger(MarketDataService.name);
    private readonly httpClient: RestClientV5 = new RestClientV5();

    constructor(private readonly tickerService: TickersService) {}

    async getSymbolData(
        dto: GetSymbolDataDto,
        endTimestamp: number = new Date().getTime()
    ): Promise<SymbolDataResponseDto[]> {
        const { symbol, candles, interval } = dto;
        const result: SymbolDataResponseDto[] = [];
        const limit = 1000;

        while (result.length < candles) {
            const response = await this.httpClient
                .getKline({
                    category: "spot",
                    symbol,
                    interval,
                    end: endTimestamp,
                    limit: Math.min(limit, candles - result.length)
                })
                .catch((err) => {
                    this.logger.error("Ошибка при запросе свечей", err);
                    return null;
                });

            const klineList: OHLCVKlineV5[] = response?.result?.list ?? [];
            if (!klineList.length) {
                break;
            }

            const formatted = formatKlineData(klineList);
            result.push(...formatted);

            endTimestamp = Number(klineList[klineList.length - 1][0] + 1);
        }

        return result.slice(0, candles);
    }

    async getMarketData(symbolId: number, dto: GetMarketDataDto): Promise<SymbolDataResponseDto[]> {
        const ticker = await this.tickerService.findOneById(symbolId);

        if (!ticker) {
            throw new NotFoundException("Тикер не найден");
        }

        const endTimestamp = Date.now() - dto.page * dto.candles * intervalToMs(dto.interval);

        return this.getSymbolData(
            {
                symbol: ticker.name,
                candles: dto.candles,
                interval: dto.interval
            },
            endTimestamp
        );
    }
}

export function formatKlineData(klineData: OHLCVKlineV5[]): SymbolDataResponseDto[] {
    return klineData.map((entry) => ({
        time: new Date(Number(entry[0])),
        open: Number(entry[1]),
        high: Number(entry[2]),
        low: Number(entry[3]),
        close: Number(entry[4]),
        volume: Number(entry[5])
    }));
}
