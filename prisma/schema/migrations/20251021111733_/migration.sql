/*
  Warnings:

  - You are about to drop the column `realPricr` on the `ticker_processing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ticker_processing" DROP COLUMN "realPricr",
ADD COLUMN     "realPrice" INTEGER;
