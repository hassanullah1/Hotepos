-- AlterTable
ALTER TABLE "buyers" ADD COLUMN     "reset_token" VARCHAR(64),
ADD COLUMN     "reset_token_expires_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "idx_buyers_reset_token" ON "buyers"("reset_token");
