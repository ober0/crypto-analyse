/*
  Warnings:

  - The values [DeepseekR1T,Qwen3] on the enum `Models` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Models_new" AS ENUM ('Gpt5', 'Deepseek4Flash', 'Llama4');
ALTER TABLE "ticker_processing" ALTER COLUMN "model" TYPE "Models_new" USING ("model"::text::"Models_new");
ALTER TYPE "Models" RENAME TO "Models_old";
ALTER TYPE "Models_new" RENAME TO "Models";
DROP TYPE "public"."Models_old";
COMMIT;
