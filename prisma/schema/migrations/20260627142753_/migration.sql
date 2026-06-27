/*
  Warnings:

  - Changed the type of `model` on the `usage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "usage" DROP COLUMN "model",
ADD COLUMN     "model" "Models" NOT NULL;
