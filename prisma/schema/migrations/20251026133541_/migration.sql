-- AlterTable
ALTER TABLE "ticker_processing" ALTER COLUMN "difference" DROP NOT NULL,
ALTER COLUMN "pnl" DROP NOT NULL,
ALTER COLUMN "unrealizedDifference" DROP NOT NULL,
ALTER COLUMN "unrealizedPnl" DROP NOT NULL;
