/*
  Warnings:

  - You are about to alter the column `userId` on the `AISData` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `mmsi` on the `AISData` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "AISData" ALTER COLUMN "userId" SET DATA TYPE INTEGER,
ALTER COLUMN "mmsi" SET DATA TYPE INTEGER;
