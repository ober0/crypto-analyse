/*
  Warnings:

  - Added the required column `type` to the `usage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "usage_type" AS ENUM ('TickerProcessing', 'BotProcessing');

-- DropForeignKey
ALTER TABLE "public"."trade" DROP CONSTRAINT "trade_aiProcessingId_fkey";

-- AlterTable
ALTER TABLE "usage" ADD COLUMN     "type" "usage_type" NOT NULL;

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_aiProcessingId_fkey" FOREIGN KEY ("aiProcessingId") REFERENCES "ai_processing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
