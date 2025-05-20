/*
  Warnings:

  - Made the column `position` on table `AISData` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AISData" ALTER COLUMN "position" SET NOT NULL;
