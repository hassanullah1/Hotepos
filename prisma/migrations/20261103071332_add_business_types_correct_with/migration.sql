-- AlterTable
ALTER TABLE "pending_signups" ADD COLUMN     "business_type_id" UUID;

-- AddForeignKey
ALTER TABLE "pending_signups" ADD CONSTRAINT "pending_signups_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
