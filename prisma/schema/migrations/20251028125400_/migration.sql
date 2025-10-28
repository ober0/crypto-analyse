-- CreateEnum
CREATE TYPE "role_names" AS ENUM ('Admin', 'User');

-- CreateEnum
CREATE TYPE "timeframe_enum" AS ENUM ('OneDay', 'OneWeek');

-- CreateEnum
CREATE TYPE "direction_enum" AS ENUM ('Short', 'Long', 'Nothing');

-- CreateEnum
CREATE TYPE "Models" AS ENUM ('Gpt5', 'DeepseekR1T', 'Qwen3', 'Llama4');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Legal', 'Individual');

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "name" "role_names" NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

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
    "model" "Models" NOT NULL,
    "direction" "direction_enum" NOT NULL,
    "leverage" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "predictedPrice" DOUBLE PRECISION NOT NULL,
    "realPrice" DOUBLE PRECISION,
    "difference" DOUBLE PRECISION,
    "unrealizedDifference" DOUBLE PRECISION,
    "pnl" DOUBLE PRECISION,
    "unrealizedPnl" DOUBLE PRECISION,
    "isPredictAchieved" BOOLEAN,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticker_processing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "ticker_processing_isClosed_idx" ON "ticker_processing"("isClosed");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticker_processing" ADD CONSTRAINT "ticker_processing_tickersId_fkey" FOREIGN KEY ("tickersId") REFERENCES "tickers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
