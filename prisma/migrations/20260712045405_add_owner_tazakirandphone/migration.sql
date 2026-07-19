/*
  Warnings:

  - You are about to drop the column `email` on the `Owner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tazkiraNumber]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Owner_email_key";

-- AlterTable
ALTER TABLE "Owner" DROP COLUMN "email",
ADD COLUMN     "password" TEXT,
ADD COLUMN     "tazkiraNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Owner_phone_key" ON "Owner"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_tazkiraNumber_key" ON "Owner"("tazkiraNumber");
