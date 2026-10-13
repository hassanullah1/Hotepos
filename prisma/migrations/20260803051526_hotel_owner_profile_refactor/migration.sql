/*
  Warnings:

  - The primary key for the `hotel_owners` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `is_primary` on the `hotel_owners` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hotel_id]` on the table `hotel_owners` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "idx_hotel_owners_hotel";

-- DropIndex
DROP INDEX "idx_hotel_owners_user";

-- AlterTable
ALTER TABLE "hotel_owners" DROP CONSTRAINT "hotel_owners_pkey",
DROP COLUMN "is_primary",
ADD COLUMN     "address" TEXT,
ADD CONSTRAINT "hotel_owners_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address";

-- CreateIndex
CREATE UNIQUE INDEX "hotel_owners_hotel_id_key" ON "hotel_owners"("hotel_id");
