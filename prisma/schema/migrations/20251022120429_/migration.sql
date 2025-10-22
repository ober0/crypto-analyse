-- AlterTable
ALTER TABLE "ticker_processing" ADD COLUMN     "difference" INTEGER,
ADD COLUMN     "leverageDifference" INTEGER,
ALTER COLUMN "closedAt" DROP NOT NULL;
