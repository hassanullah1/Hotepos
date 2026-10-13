/*
  Warnings:

  - The primary key for the `hotel_owners` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "hotel_owners" DROP CONSTRAINT "hotel_owners_pkey",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "hotel_owners_pkey" PRIMARY KEY ("id");
