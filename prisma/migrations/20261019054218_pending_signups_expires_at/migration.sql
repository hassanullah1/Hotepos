-- AlterTable
ALTER TABLE "hotel_owners" ADD COLUMN     "expires_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "idx_pending_signups_expires" ON "hotel_owners"("expires_at");
