/*
  Warnings:

  - Made the column `aiProcessingId` on table `trade` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."trade" DROP CONSTRAINT "trade_aiProcessingId_fkey";

-- AlterTable
ALTER TABLE "trade" ALTER COLUMN "aiProcessingId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_aiProcessingId_fkey" FOREIGN KEY ("aiProcessingId") REFERENCES "ai_processing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
