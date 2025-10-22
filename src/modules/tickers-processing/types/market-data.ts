import { SymbolDataResponseDto } from "../../market-data/dto/response.dto";

export type MarketData = {
    fifteenMinutes?: SymbolDataResponseDto[];
    oneHour?: SymbolDataResponseDto[];
    oneDay?: SymbolDataResponseDto[];
    oneWeek?: SymbolDataResponseDto[];
};
