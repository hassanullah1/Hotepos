-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "business_type_id" UUID;

-- CreateIndex
CREATE INDEX "idx_hotels_business_type" ON "hotels"("business_type_id");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
