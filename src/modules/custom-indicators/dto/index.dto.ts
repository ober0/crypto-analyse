export enum IndicatorsEnum {
    BOS = "BOS",
    CHOCH = "CHOCH",
    OB = "OB",
    FVG = "FVG",
    EHL = "EHL",
    PD = "PD",
    RSI = "RSI",
    EMA = "EMA",
    VWAP = "VWAP",
    BOLLINGER_BANDS = "BOLLINGER_BANDS",
    HEIKEN_ASHI = "HEIKEN_ASHI",
    DIFFERENCE_MOMENTUM = "DIFFERENCE_MOMENTUM"
}
export type IndicatorsResponse = Partial<Record<IndicatorsEnum, string>>;

export interface PricePoint {
    time: number;
    value: number;
}

export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
