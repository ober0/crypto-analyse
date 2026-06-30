-- DropForeignKey
ALTER TABLE "public"."processing_logs" DROP CONSTRAINT "processing_logs_aiProcessingId_fkey";

-- AddForeignKey
ALTER TABLE "processing_logs" ADD CONSTRAINT "processing_logs_aiProcessingId_fkey" FOREIGN KEY ("aiProcessingId") REFERENCES "ai_processing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
