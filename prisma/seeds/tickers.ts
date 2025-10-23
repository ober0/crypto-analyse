import { PrismaClient } from "@prisma/client";

enum SymbolEnum {
    BTCUSDT = "BTCUSDT",
    LTCUSDT = "LTCUSDT",
    ETHUSDT = "ETHUSDT",
    SOLUSDT = "SOLUSDT",
    DOGEUSDT = "DOGEUSDT",
    TRXUSDT = "TRXUSDT",
    ADAUSDT = "ADAUSDT",
    TONUSDT = "TONUSDT"
}

export async function tickersSeed(prisma: PrismaClient) {
    for (const symbol of Object.values(SymbolEnum)) {
        const exist = await prisma.tickers.findFirst({
            where: {
                name: symbol
            }
        });

        if (!exist) {
            await prisma.tickers.create({
                data: {
                    name: symbol
                }
            });
        }
    }
}
