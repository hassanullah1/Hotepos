-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT false;
