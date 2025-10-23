import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Candle, IndicatorsEnum, IndicatorsResponse, PricePoint } from "src/modules/custom-indicators/dto/index.dto";
import { GetSymbolDataDto } from "../market-data/dto/get-symbol-data.dto";
import { MarketDataService } from "../market-data/market-data.service";
import { SymbolDataResponseDto } from "../market-data/dto/response.dto";
import { ADX, ATR, EMA, highest, lowest, RSI, BollingerBands } from "technicalindicators";

@Injectable()
export class CustomIndicatorsService {
    constructor(private readonly marketDataService: MarketDataService) {}

    async getIndicators(dto: GetSymbolDataDto): Promise<IndicatorsResponse> {
        const marketData: SymbolDataResponseDto[] = await this.marketDataService.getSymbolData(dto);

        return this.calcIndicators(marketData, dto);
    }

    private async calcIndicators(
        marketData: SymbolDataResponseDto[],
        dto: GetSymbolDataDto
    ): Promise<IndicatorsResponse> {
        const result: IndicatorsResponse = {};

        const bosData: Candle[] = [];
        const vwapData: Candle[] = [];
        const obData: Candle[] = [];
        const fvgData: Candle[] = [];
        const closePrices: PricePoint[] = [];
        const highPrices: PricePoint[] = [];
        const lowPrices: PricePoint[] = [];
        const volumes: PricePoint[] = [];
        const sequential: Candle[] = [];

        const { candles } = dto;

        for (const { open, high, low, close, volume, time } of marketData) {
            const o = Number(open);
            const h = Number(high);
            const l = Number(low);
            const c = Number(close);
            const v = Number(volume);
            const t = new Date(time).getTime();

            bosData.push({ time: t, open: o, high: h, low: l, close: c, volume: v });
            vwapData.push({ time: t, open: o, high: h, low: l, close: c, volume: v });
            obData.push({ time: t, open: o, high: h, low: l, close: c, volume: v });
            fvgData.push({ time: t, open: o, high: h, low: l, close: c, volume: v });
            closePrices.push({ time: t, value: c });
            highPrices.push({ time: t, value: h });
            lowPrices.push({ time: t, value: l });
            volumes.push({ time: t, value: v });
            sequential.push({ time: t, open: o, high: h, low: l, close: c, volume: v });
        }

        for (const indicator of Object.values(IndicatorsEnum)) {
            switch (indicator) {
                case IndicatorsEnum.BOS:
                    result[indicator] = await this.detectBOS(bosData, candles);
                    break;
                case IndicatorsEnum.CHOCH:
                    result[indicator] = await this.detectCHOCH(bosData, candles);
                    break;
                case IndicatorsEnum.OB:
                    result[indicator] = await this.detectOrderBlocks(obData);
                    break;
                case IndicatorsEnum.FVG:
                    result[indicator] = await this.detectFVG(fvgData);
                    break;
                case IndicatorsEnum.EHL:
                    result[indicator] = await this.detectEqualHighsLows(fvgData);
                    break;
                case IndicatorsEnum.PD:
                    result[indicator] = await this.detectPremiumDiscount(fvgData);
                    break;
                case IndicatorsEnum.RSI:
                    result[indicator] = await this.calculateRSI(
                        closePrices.map((d) => d.value),
                        candles
                    );
                    break;
                case IndicatorsEnum.EMA:
                    result[indicator] = await this.calculateEMA(
                        closePrices.map((d) => d.value),
                        candles
                    );
                    break;
                case IndicatorsEnum.VWAP:
                    result[indicator] = await this.calculateVWAP(vwapData);
                    break;
                case IndicatorsEnum.BOLLINGER_BANDS:
                    result[indicator] = await this.calculateBollingerBands(
                        closePrices.map((d) => d.value),
                        candles
                    );
                    break;
                case IndicatorsEnum.HEIKEN_ASHI:
                    result[indicator] = await this.calculateHeikenAshi(obData);
                    break;
                case IndicatorsEnum.DIFFERENCE_MOMENTUM:
                    result[indicator] = await this.calculateDifferenceMomentumCodeB(closePrices, candles);
                    break;
            }
        }

        return result;
    }

    async calculateBollingerBands(closePrices: number[], period: number = 20, stdDev: number = 2): Promise<string> {
        if (closePrices.length < period) {
            throw new BadRequestException("Недостаточно данных для расчёта Bollinger Bands");
        }

        const result = BollingerBands.calculate({
            period,
            stdDev,
            values: closePrices
        });

        const lastPrice = closePrices[closePrices.length - 1];
        const lastBand = result[result.length - 1];
        let signal = "Нейтральный";
        if (lastPrice > lastBand.upper) {
            signal = "Перекуплен (Sell)";
        }
        if (lastPrice < lastBand.lower) {
            signal = "Перепродан (Buy)";
        }

        return JSON.stringify({
            middle: lastBand.middle,
            upper: lastBand.upper,
            lower: lastBand.lower,
            signal,
            description: `Bollinger Bands: Цена ${lastPrice}, Средняя: ${lastBand.middle}, Верхняя: ${lastBand.upper}, Нижняя: ${lastBand.lower} (${signal})`
        });
    }

    async calculateHeikenAshi(
        candles: { time: number; open: number; high: number; low: number; close: number }[]
    ): Promise<string> {
        const haCandles: {
            time?: number;
            haOpen: number;
            haHigh: number;
            haLow: number;
            haClose: number;
            trend?: string;
            description?: string;
        }[] = [];
        for (let i = 0; i < candles.length; i++) {
            const candle = candles[i];
            const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
            const haOpen =
                i === 0 ? (candle.open + candle.close) / 2 : (haCandles[i - 1].haOpen + haCandles[i - 1].haClose) / 2;
            const haHigh = Math.max(candle.high, haOpen, haClose);
            const haLow = Math.min(candle.low, haOpen, haClose);

            haCandles.push({ time: candles?.at(i)?.time, haOpen, haHigh, haLow, haClose });

            if (i > 0) {
                const trend = haClose > haOpen ? "Бычий" : haClose < haOpen ? "Медвежий" : "Нейтральный";
                haCandles[i].trend = trend;
                haCandles[i].description = `Heiken Ashi: ${trend} свеча`;
            }
        }
        return JSON.stringify(haCandles);
    }

    async calculateDifferenceMomentumCodeB(
        closePrices: { value: number; time: number }[],
        period: number = 14
    ): Promise<string> {
        const close = closePrices.map((data) => data.value);

        const momentum = await this.calculateMomentum(closePrices, period);
        const momentumData = momentum.map((data) => data.momentum);
        const normalizedMomentum = momentumData.map((value) => (value / close[close.length - 1]) * 100);
        const lastMomentum = normalizedMomentum[normalizedMomentum.length - 1];
        const signal = lastMomentum > 0 ? "Бычий" : "Медвежий";
        return JSON.stringify({
            value: lastMomentum,
            signal,
            description: `Difference Momentum (Code B): ${lastMomentum}% (${signal})`
        });
    }

    async calculateMomentum(
        closePrices: { time: number; value: number }[],
        period: number
    ): Promise<{ time: number; momentum: number }[]> {
        return closePrices
            .map((price, index) => {
                if (index < period) {
                    return null;
                }
                return {
                    time: price.time,
                    momentum: price.value - closePrices[index - period].value
                };
            })
            .filter((item): item is { time: number; momentum: number } => item !== null);
    }

    async calculateVWAP(candles: { high: number; low: number; close: number; volume: number }[]): Promise<string> {
        let totalVolume = 0;
        let totalPriceVolume = 0;

        for (const candle of candles) {
            const typicalPrice = (candle.high + candle.low + candle.close) / 3;
            totalPriceVolume += typicalPrice * candle.volume;
            totalVolume += candle.volume;
        }

        let vwapDescription = "";

        if (!totalVolume) {
            vwapDescription = "Не удалось вычислить VWAP из-за отсутствия данных.";
        } else if (candles[0].close > totalVolume) {
            vwapDescription = "Цена выше VWAP, что указывает на возможный бычий тренд.";
            if (candles[0].volume < candles[1].volume) {
                vwapDescription += " Однако объемы снижаются, возможен ложный рост.";
            }
        } else if (candles[0].close < totalVolume) {
            vwapDescription = "Цена ниже VWAP, что указывает на возможный медвежий тренд.";
            if (candles[0].volume < candles[1].volume) {
                vwapDescription += " Однако объемы падают, возможен разворот.";
            }
        } else {
            vwapDescription = "Цена находится на уровне VWAP. Возможна консолидация.";
        }

        return JSON.stringify({
            value: totalPriceVolume / totalVolume,
            description: vwapDescription
        });
    }

    async detectBOS(candles: { high: number; low: number; close: number }[], period: number) {
        const highestHigh = highest({ period, values: candles.map((c) => c.high) });
        const lowestLow = lowest({ period, values: candles.map((c) => c.low) });

        const lastCandle = candles[candles.length - 1];
        const prevHigh = highestHigh[highestHigh.length - 2];
        const prevLow = lowestLow[lowestLow.length - 2];

        if (lastCandle.close > prevHigh) {
            return "BULLISH_BOS";
        }
        if (lastCandle.close < prevLow) {
            return "BEARISH_BOS";
        }

        if (lastCandle.high > prevHigh && lastCandle.low < prevLow) {
            return "STRONG_BOS";
        }

        return "NO_BOS";
    }

    async detectCHOCH(candles: { high: number; low: number; close: number }[], period: number) {
        const trend = await this.detectBOS(candles, period);
        const prevTrend = await this.detectBOS(candles.slice(0, -1), period);

        if (prevTrend === "BULLISH_BOS" && trend === "BEARISH_BOS") {
            return "BEARISH_CHOCH";
        }
        if (prevTrend === "BEARISH_BOS" && trend === "BULLISH_BOS") {
            return "BULLISH_CHOCH";
        }
        if (prevTrend === "STRONG_BOS" && trend === "NO_BOS") {
            return "NO_CHOCH";
        }

        return "NO_CHOCH";
    }

    async detectOrderBlocks(candles: { open: number; close: number; high: number; low: number }[]) {
        const lastCandle = candles[candles.length - 1];
        const prevCandle = candles[candles.length - 2];

        if (prevCandle.close < prevCandle.open && lastCandle.close > lastCandle.open) {
            return JSON.stringify({ type: "BULLISH_OB", level: prevCandle.low });
        }

        if (prevCandle.close > prevCandle.open && lastCandle.close < lastCandle.open) {
            return JSON.stringify({ type: "BEARISH_OB", level: prevCandle.high });
        }

        if (lastCandle.close < lastCandle.open && lastCandle.low < prevCandle.low) {
            return JSON.stringify({ type: "BEARISH_OB", level: lastCandle.low });
        }
        if (lastCandle.close > lastCandle.open && lastCandle.high > prevCandle.high) {
            return JSON.stringify({ type: "BULLISH_OB", level: lastCandle.high });
        }

        return JSON.stringify({ type: "NO_OB", level: null });
    }

    async detectFVG(candles: { high: number; low: number }[], minGap: number = 0) {
        for (let i = candles.length - 2; i > 0; i--) {
            const prevCandle = candles[i - 1];
            const nextCandle = candles[i + 1];

            const gapSize = Math.abs(nextCandle.low - prevCandle.high);
            if (gapSize < minGap) {
                continue;
            }

            if (prevCandle.high < nextCandle.low) {
                return JSON.stringify({ type: "BULLISH_FVG", gap: [prevCandle.high, nextCandle.low] });
            } else if (prevCandle.low > nextCandle.high) {
                return JSON.stringify({ type: "BEARISH_FVG", gap: [nextCandle.high, prevCandle.low] });
            }
        }

        return JSON.stringify({ type: "NO_FVG", gap: null });
    }

    async detectEqualHighsLows(candles: { high: number; low: number }[], threshold: number = 0.001) {
        const result = {
            equalHighs: false,
            equalLows: false
        };

        for (let i = 1; i < candles.length; i++) {
            if (Math.abs(candles[i].high - candles[i - 1].high) < threshold) {
                result.equalHighs = true;
            }
            if (Math.abs(candles[i].low - candles[i - 1].low) < threshold) {
                result.equalLows = true;
            }

            if (result.equalHighs && result.equalLows) {
                break;
            }
        }

        if (result.equalHighs) {
            return "EQUAL_HIGHS";
        }
        if (result.equalLows) {
            return "EQUAL_LOWS";
        }
        return "NO_EQH_EQL";
    }

    async detectPremiumDiscount(
        candles: { high: number; low: number; close: number }[],
        useClosingPrice: boolean = false
    ) {
        const midPrice =
            candles.reduce((sum, c) => {
                if (useClosingPrice) {
                    return sum + c.close;
                } else {
                    return sum + (c.high + c.low) / 2;
                }
            }, 0) / candles.length;

        const lastPrice = candles[candles.length - 1].close;

        return lastPrice > midPrice ? "PREMIUM_ZONE" : "DISCOUNT_ZONE";
    }

    async calculateRSI(closePrices: number[], period: number) {
        if (closePrices.length < period) {
            throw new BadRequestException("Недостаточно данных для расчёта RSI");
        }

        const rsiValues = RSI.calculate({ values: closePrices, period });
        const currentRSI = rsiValues[rsiValues.length - 1];

        if (currentRSI > 70) {
            return JSON.stringify({ value: currentRSI, signal: "Перекуплен (Sell)" });
        } else if (currentRSI < 30) {
            return JSON.stringify({ value: currentRSI, signal: "Перепродан (Buy)" });
        } else {
            return JSON.stringify({ value: currentRSI, signal: "Нейтральный" });
        }
    }

    async calculateEMA(closePrices: number[], period: number) {
        if (closePrices.length < period) {
            throw new BadRequestException("Недостаточно данных для расчёта EMA");
        }

        const emaValues = EMA.calculate({ values: closePrices, period });
        const currentEMA = emaValues[emaValues.length - 1];
        const lastPrice = closePrices[closePrices.length - 1];

        const trend = lastPrice > currentEMA ? "Бычий" : "Медвежий";

        return JSON.stringify({
            value: currentEMA,
            trend: trend,
            signal: trend === "Бычий" ? "Buy" : "Sell"
        });
    }
}
