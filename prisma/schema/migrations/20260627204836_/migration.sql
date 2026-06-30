/*
  Warnings:

  - Added the required column `currentPrice` to the `trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "trade_close_reason" ADD VALUE 'BotDisable';

-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "currentPrice" DECIMAL(32,16) NOT NULL;
