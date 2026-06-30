/*
  Warnings:

  - The values [Change_stop_loss,Change_take_profit,Close] on the enum `trade_action_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `realizedPnl` on the `trade_action` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "trade_action_type_new" AS ENUM ('Open', 'Buy', 'Sell', 'Change_sl_tp', 'PartialSell');
ALTER TABLE "trade_action" ALTER COLUMN "type" TYPE "trade_action_type_new" USING ("type"::text::"trade_action_type_new");
ALTER TYPE "trade_action_type" RENAME TO "trade_action_type_old";
ALTER TYPE "trade_action_type_new" RENAME TO "trade_action_type";
DROP TYPE "public"."trade_action_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "trade_action" DROP COLUMN "realizedPnl",
ADD COLUMN     "oldStopLoss" DECIMAL(32,16),
ADD COLUMN     "oldTakeProfit" DECIMAL(32,16);
