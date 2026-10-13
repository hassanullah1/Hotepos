-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "customer_id" UUID,
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "idx_payments_customer" ON "payments"("customer_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
