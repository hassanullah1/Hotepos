/*
  Warnings:

  - You are about to drop the column `owner_id` on the `hotels` table. All the data in the column will be lost.
  - You are about to drop the column `hotel_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "hotels" DROP CONSTRAINT "hotels_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_hotel_id_fkey";

-- DropIndex
DROP INDEX "idx_hotels_owner";

-- DropIndex
DROP INDEX "idx_users_hotel";

-- DropIndex
DROP INDEX "users_hotel_id_username_key";

-- AlterTable
ALTER TABLE "hotels" DROP COLUMN "owner_id";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "hotel_id";

-- CreateTable
CREATE TABLE "hotel_owners" (
    "hotel_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_primary" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_owners_pkey" PRIMARY KEY ("hotel_id","user_id")
);

-- CreateIndex
CREATE INDEX "idx_hotel_owners_hotel" ON "hotel_owners"("hotel_id");

-- CreateIndex
CREATE INDEX "idx_hotel_owners_user" ON "hotel_owners"("user_id");

-- AddForeignKey
ALTER TABLE "hotel_owners" ADD CONSTRAINT "hotel_owners_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hotel_owners" ADD CONSTRAINT "hotel_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
