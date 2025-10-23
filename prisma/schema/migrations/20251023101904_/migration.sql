/*
  Warnings:

  - Added the required column `model` to the `ticker_processing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Models" AS ENUM ('Gpt5', 'DeepdeekR1');

-- AlterTable
ALTER TABLE "ticker_processing" ADD COLUMN     "model" "Models" NOT NULL;
