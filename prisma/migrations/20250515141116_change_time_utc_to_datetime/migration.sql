/*
  Warnings:

  - The `timeUtc` column on the `AISData` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AISData" DROP COLUMN "timeUtc",
ADD COLUMN     "timeUtc" TIMESTAMP(3);
