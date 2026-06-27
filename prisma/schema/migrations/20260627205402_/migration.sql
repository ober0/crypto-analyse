/*
  Warnings:

  - Added the required column `model` to the `ai_processing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ai_processing" ADD COLUMN     "model" "Models" NOT NULL;
