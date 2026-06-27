-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "aiProcessingId" INTEGER;

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_aiProcessingId_fkey" FOREIGN KEY ("aiProcessingId") REFERENCES "ai_processing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
