/*
  Warnings:

  - The values [NoAction] on the enum `trade_action_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "processing_logs_enum" AS ENUM ('TradePass', 'TradeOpen', 'TradeActive', 'TradeClose');

-- AlterEnum
BEGIN;
CREATE TYPE "trade_action_type_new" AS ENUM ('Open', 'Buy', 'Sell', 'Partial_close', 'Change_stop_loss', 'Change_take_profit', 'Close');
ALTER TABLE "trade_action" ALTER COLUMN "type" TYPE "trade_action_type_new" USING ("type"::text::"trade_action_type_new");
ALTER TYPE "trade_action_type" RENAME TO "trade_action_type_old";
ALTER TYPE "trade_action_type_new" RENAME TO "trade_action_type";
DROP TYPE "public"."trade_action_type_old";
COMMIT;

-- CreateTable
CREATE TABLE "processing_logs" (
    "id" SERIAL NOT NULL,
    "type" "processing_logs_enum" NOT NULL,
    "text" TEXT,
    "aiProcessingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "processing_logs" ADD CONSTRAINT "processing_logs_aiProcessingId_fkey" FOREIGN KEY ("aiProcessingId") REFERENCES "ai_processing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
