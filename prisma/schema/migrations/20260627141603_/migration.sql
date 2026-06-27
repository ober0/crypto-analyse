/*
  Warnings:

  - A unique constraint covering the columns `[usageId]` on the table `ticker_processing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usageId` to the `ticker_processing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ticker_processing" ADD COLUMN     "usageId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "usage" (
    "id" SERIAL NOT NULL,
    "prompt" INTEGER NOT NULL,
    "response" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticker_processing_usageId_key" ON "ticker_processing"("usageId");

-- AddForeignKey
ALTER TABLE "ticker_processing" ADD CONSTRAINT "ticker_processing_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "usage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
