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
            let isPredictAchieved: boolean = false;

            if (!ticker.realPrice) {
                return;
            }

            if (ticker.direction === "Long") {
                if (ticker?.realPrice <= ticker.predictedPrice) {
                    isPredictAchieved = true;
                }
            } else {
                if (ticker?.realPrice >= ticker.predictedPrice) {
                    isPredictAchieved = true;
                }
            }

            await prisma.tickerProcessing.update({
                where: {
                    id: ticker.id
                },
                data: {
                    isPredictAchieved
                }
            });
        })
    );
}

main();
prisma.$disconnect();
