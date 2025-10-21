-- CreateEnum
CREATE TYPE "timeframe_enum" AS ENUM ('OneDay', 'OneWeek');

-- CreateEnum
CREATE TYPE "direction_enum" AS ENUM ('Short', 'Long', 'Nothing');

-- CreateTable
CREATE TABLE "tickers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticker_processing" (
    "id" SERIAL NOT NULL,
    "tickersId" INTEGER NOT NULL,
    "timeframe" "timeframe_enum" NOT NULL,
    "direction" "direction_enum" NOT NULL,
    "leverage" INTEGER,
    "stopLoss" INTEGER,
    "takeProfit" INTEGER,
    "currentPrice" INTEGER NOT NULL,
    "predictedPrice" INTEGER NOT NULL,
    "realPricr" INTEGER,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticker_processing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticker_processing" ADD CONSTRAINT "ticker_processing_tickersId_fkey" FOREIGN KEY ("tickersId") REFERENCES "tickers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
