/*
  Warnings:

  - You are about to drop the column `expires_at` on the `hotel_owners` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_pending_signups_expires";

-- AlterTable
ALTER TABLE "hotel_owners" DROP COLUMN "expires_at";

-- AlterTable
ALTER TABLE "pending_signups" ADD COLUMN     "expires_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "idx_pending_signups_expires" ON "pending_signups"("expires_at");
