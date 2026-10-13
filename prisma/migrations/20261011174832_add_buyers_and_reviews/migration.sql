/*
  Warnings:

  - You are about to drop the column `author_name` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[public_token]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `buyer_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Made the column `menu_item_id` on table `reviews` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branch_id` on table `reviews` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_menu_item_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_order_id_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "buyer_id" UUID,
ADD COLUMN     "public_token" VARCHAR(64),
ADD COLUMN     "source" VARCHAR(20) DEFAULT 'pos';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "buyer_id" UUID;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "author_name",
DROP COLUMN "customer_id",
ADD COLUMN     "buyer_id" UUID NOT NULL,
ALTER COLUMN "menu_item_id" SET NOT NULL,
ALTER COLUMN "branch_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "room_stays" ADD COLUMN     "buyer_id" UUID;

-- CreateTable
CREATE TABLE "buyers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150),
    "phone" VARCHAR(30),
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buyers_email_key" ON "buyers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "buyers_phone_key" ON "buyers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "orders_public_token_key" ON "orders"("public_token");

-- CreateIndex
CREATE INDEX "idx_orders_source" ON "orders"("source");

-- CreateIndex
CREATE INDEX "idx_orders_buyer" ON "orders"("buyer_id");

-- CreateIndex
CREATE INDEX "idx_payments_buyer" ON "payments"("buyer_id");

-- CreateIndex
CREATE INDEX "idx_reviews_buyer" ON "reviews"("buyer_id");

-- CreateIndex
CREATE INDEX "idx_stays_buyer" ON "room_stays"("buyer_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_stays" ADD CONSTRAINT "room_stays_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- RenameIndex
ALTER INDEX "reviews_branch_id_idx" RENAME TO "idx_reviews_branch";

-- RenameIndex
ALTER INDEX "reviews_menu_item_id_idx" RENAME TO "idx_reviews_item";

-- RenameIndex
ALTER INDEX "reviews_rating_idx" RENAME TO "idx_reviews_rating";
