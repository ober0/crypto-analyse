-- AlterTable
ALTER TABLE "usage" ADD COLUMN     "aiProcessingId" INTEGER;

-- AddForeignKey
ALTER TABLE "usage" ADD CONSTRAINT "usage_aiProcessingId_fkey" FOREIGN KEY ("aiProcessingId") REFERENCES "ai_processing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
