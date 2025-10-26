/*
  Warnings:

  - You are about to drop the column `leverageDifference` on the `ticker_processing` table. All the data in the column will be lost.
  - You are about to drop the column `percentDifference` on the `ticker_processing` table. All the data in the column will be lost.
  - Added the required column `pnl` to the `ticker_processing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unrealizedDifference` to the `ticker_processing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unrealizedPnl` to the `ticker_processing` table without a default value. This is not possible if the table is not empty.
  - Made the column `difference` on table `ticker_processing` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ticker_processing" DROP COLUMN "leverageDifference",
DROP COLUMN "percentDifference",
ADD COLUMN     "pnl" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unrealizedDifference" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unrealizedPnl" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "difference" SET NOT NULL;
