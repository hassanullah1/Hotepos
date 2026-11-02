/*
  Warnings:

  - You are about to drop the column `branch_id` on the `menu_categories` table. All the data in the column will be lost.
  - You are about to drop the column `branch_id` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `menu_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hotel_id,name]` on the table `menu_categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hotel_id` to the `menu_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_price` to the `menu_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hotel_id` to the `menu_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "menu_categories" DROP CONSTRAINT "menu_categories_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_branch_id_fkey";

-- DropIndex
DROP INDEX "idx_menu_items_branch";

-- DropIndex
DROP INDEX "idx_menu_items_public";

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "business_type" VARCHAR(30) NOT NULL DEFAULT 'hotel';

-- AlterTable
ALTER TABLE "menu_categories" DROP COLUMN "branch_id",
ADD COLUMN     "default_product_category_id" UUID,
ADD COLUMN     "hotel_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "branch_id",
DROP COLUMN "price",
ADD COLUMN     "base_price" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "hotel_id" UUID NOT NULL,
ADD COLUMN     "product_category_id" UUID,
ADD COLUMN     "product_kind" VARCHAR(20) NOT NULL DEFAULT 'prepared';

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "image_url" TEXT,
    "parent_id" UUID,
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_menu_items" (
    "branch_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "price_override" DECIMAL(12,2),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,

    CONSTRAINT "branch_menu_items_pkey" PRIMARY KEY ("branch_id","menu_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_key_key" ON "product_categories"("key");

-- CreateIndex
CREATE INDEX "idx_product_categories_parent" ON "product_categories"("parent_id");

-- CreateIndex
CREATE INDEX "idx_product_categories_active" ON "product_categories"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "idx_bmi_item" ON "branch_menu_items"("menu_item_id");

-- CreateIndex
CREATE INDEX "idx_bmi_branch_online" ON "branch_menu_items"("branch_id", "is_online");

-- CreateIndex
CREATE INDEX "idx_menu_categories_hotel" ON "menu_categories"("hotel_id");

-- CreateIndex
CREATE INDEX "idx_menu_categories_default_product" ON "menu_categories"("default_product_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_hotel_id_name_key" ON "menu_categories"("hotel_id", "name");

-- CreateIndex
CREATE INDEX "idx_menu_items_hotel" ON "menu_items"("hotel_id");

-- CreateIndex
CREATE INDEX "idx_menu_items_product_category" ON "menu_items"("product_category_id");

-- CreateIndex
CREATE INDEX "idx_menu_items_public" ON "menu_items"("hotel_id", "is_available", "is_online");

-- CreateIndex
CREATE INDEX "idx_menu_items_product_category_public" ON "menu_items"("product_category_id", "is_available", "is_online");

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_default_product_category_id_fkey" FOREIGN KEY ("default_product_category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_menu_items" ADD CONSTRAINT "branch_menu_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_menu_items" ADD CONSTRAINT "branch_menu_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
