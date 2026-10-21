-- CreateTable
CREATE TABLE "online_order_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "contact_name" VARCHAR(150) NOT NULL,
    "contact_phone" VARCHAR(30) NOT NULL,
    "delivery_address" TEXT,
    "delivery_city" VARCHAR(100),
    "delivery_lat" DECIMAL(10,7),
    "delivery_lng" DECIMAL(10,7),
    "delivery_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "online_order_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "online_order_details_order_id_key" ON "online_order_details"("order_id");

-- CreateIndex
CREATE INDEX "idx_online_details_order" ON "online_order_details"("order_id");

-- AddForeignKey
ALTER TABLE "online_order_details" ADD CONSTRAINT "online_order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
