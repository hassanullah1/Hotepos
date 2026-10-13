-- AlterTable
ALTER TABLE "hotel_owners" ADD COLUMN     "hesabpay_account_number" VARCHAR(30);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paid_at" TIMESTAMPTZ(6),
ADD COLUMN     "payment_reference" VARCHAR(150),
ADD COLUMN     "payment_status" VARCHAR(20) DEFAULT 'unpaid';

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "commission_account" VARCHAR(30),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "owner_account" VARCHAR(30) NOT NULL,
    "commission_account" VARCHAR(30),
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "owner_amount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "transaction_id" VARCHAR(150),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "order_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_payouts_order_id_key" ON "order_payouts"("order_id");

-- CreateIndex
CREATE INDEX "order_payouts_hotel_id_idx" ON "order_payouts"("hotel_id");

-- CreateIndex
CREATE INDEX "order_payouts_status_idx" ON "order_payouts"("status");

-- AddForeignKey
ALTER TABLE "order_payouts" ADD CONSTRAINT "order_payouts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
