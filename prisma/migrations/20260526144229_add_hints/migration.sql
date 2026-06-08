/*
  Warnings:

  - Added the required column `hints` to the `Puzzle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Puzzle" ADD COLUMN     "hints" JSONB NOT NULL;
