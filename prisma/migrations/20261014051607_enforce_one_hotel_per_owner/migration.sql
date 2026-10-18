/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `hotel_owners` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "hotel_owners_user_id_key" ON "hotel_owners"("user_id");
