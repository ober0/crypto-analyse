-- AlterTable
ALTER TABLE "ai_processing" ADD COLUMN     "lastCheckAt" TIMESTAMP(3),
ADD COLUMN     "nextCheckAt" TIMESTAMP(3);
