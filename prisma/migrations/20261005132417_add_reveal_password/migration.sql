-- AlterTable
ALTER TABLE "pending_signups" ADD COLUMN     "reveal_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "reveal_password" VARCHAR(64);
