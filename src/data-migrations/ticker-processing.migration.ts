import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const data = await prisma.tickerProcessing.findMany({
        where: {
            isClosed: true
        }
    });

    await Promise.all(
        data.map(async (ticker) => {
            const direction = ticker.direction;

            if (!ticker.realPrice) {
                return;
            }

            let resultPredicted: number;

            if (direction === "Long") {
                resultPredicted = Math.min(ticker.realPrice, ticker.predictedPrice);
            } else {
                resultPredicted = Math.max(ticker.realPrice, ticker.predictedPrice);
            }

            const difference =
                Number((resultPredicted - ticker.currentPrice).toFixed(4)) * (direction === "Long" ? 1 : -1);
            const unrealizedDifference =
                Number((ticker.realPrice - ticker.currentPrice).toFixed(4)) * (direction === "Long" ? 1 : -1);

            const pnl = Number(((difference / ticker.currentPrice) * 100).toFixed(2));
            const unrealizedPnl = Number(((unrealizedDifference / ticker.currentPrice) * 100).toFixed(2));

            await prisma.tickerProcessing.update({
                where: {
                    id: ticker.id
                },
                data: {
                    difference,
                    unrealizedDifference,
                    pnl,
                    unrealizedPnl
                }
            });
        })
    );
}

main();
