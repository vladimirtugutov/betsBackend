/*
  Warnings:

  - Changed the type of `externalBetId` on the `Bet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Bet" DROP COLUMN "externalBetId",
ADD COLUMN     "externalBetId" INTEGER NOT NULL;
