/*
  Warnings:

  - The values [Partial_close] on the enum `trade_action_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "trade_action_type_new" AS ENUM ('Open', 'Buy', 'Sell', 'Change_stop_loss', 'Change_take_profit', 'Close');
ALTER TABLE "trade_action" ALTER COLUMN "type" TYPE "trade_action_type_new" USING ("type"::text::"trade_action_type_new");
ALTER TYPE "trade_action_type" RENAME TO "trade_action_type_old";
ALTER TYPE "trade_action_type_new" RENAME TO "trade_action_type";
DROP TYPE "public"."trade_action_type_old";
COMMIT;
