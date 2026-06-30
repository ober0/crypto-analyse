/*
  Warnings:

  - Added the required column `confidence` to the `trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invalidationLevel` to the `trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mainTimeframe` to the `trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "invalidationLevel" DECIMAL(32,16) NOT NULL,
ADD COLUMN     "liquidityZone" TEXT,
ADD COLUMN     "mainTimeframe" TEXT NOT NULL;
