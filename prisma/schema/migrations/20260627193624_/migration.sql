-- CreateEnum
CREATE TYPE "processing_interval" AS ENUM ('OneDay', 'OneWeek', 'OneMonth');

-- CreateEnum
CREATE TYPE "processing_status" AS ENUM ('Ready', 'Active', 'InOrder', 'Error', 'End');

-- CreateEnum
CREATE TYPE "trade_status" AS ENUM ('Open', 'Closed');

-- CreateEnum
CREATE TYPE "trade_direction" AS ENUM ('Long', 'Short');

-- CreateEnum
CREATE TYPE "trade_action_type" AS ENUM ('Open', 'Buy', 'Sell', 'Partial_close', 'Change_leverage', 'Change_stop_loss', 'Change_take_profit', 'Close');

-- CreateEnum
CREATE TYPE "trade_close_reason" AS ENUM ('Signal', 'Sl', 'Tp');

-- CreateTable
CREATE TABLE "ai_processing" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tickersId" INTEGER NOT NULL,
    "checkIntervalMins" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "interval" "processing_interval" NOT NULL,
    "customPrompt" TEXT NOT NULL,
    "withWebSearch" BOOLEAN NOT NULL DEFAULT true,
    "status" "processing_status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_processing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade" (
    "id" SERIAL NOT NULL,
    "tickerId" INTEGER NOT NULL,
    "direction" "trade_direction" NOT NULL,
    "status" "trade_status" NOT NULL DEFAULT 'Open',
    "currentSize" DECIMAL(32,16) NOT NULL,
    "averageEntryPrice" DECIMAL(32,16) NOT NULL,
    "currentLeverage" DOUBLE PRECISION NOT NULL,
    "stopLoss" DECIMAL(32,16),
    "takeProfit" DECIMAL(32,16),
    "pnl" DECIMAL(32,16),
    "closeReason" "trade_close_reason",
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openDescription" TEXT,
    "closeDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_action" (
    "id" SERIAL NOT NULL,
    "tradeId" INTEGER NOT NULL,
    "type" "trade_action_type" NOT NULL,
    "quantity" DECIMAL(32,16),
    "price" DECIMAL(32,16),
    "leverage" DOUBLE PRECISION,
    "stopLoss" DECIMAL(32,16),
    "takeProfit" DECIMAL(32,16),
    "realizedPnl" DECIMAL(32,16),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_action_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trade_status_idx" ON "trade"("status");

-- CreateIndex
CREATE INDEX "trade_tickerId_idx" ON "trade"("tickerId");

-- CreateIndex
CREATE INDEX "trade_action_tradeId_idx" ON "trade_action"("tradeId");

-- CreateIndex
CREATE INDEX "trade_action_type_idx" ON "trade_action"("type");

-- AddForeignKey
ALTER TABLE "ai_processing" ADD CONSTRAINT "ai_processing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_processing" ADD CONSTRAINT "ai_processing_tickersId_fkey" FOREIGN KEY ("tickersId") REFERENCES "tickers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_tickerId_fkey" FOREIGN KEY ("tickerId") REFERENCES "tickers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_action" ADD CONSTRAINT "trade_action_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
