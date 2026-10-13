-- CreateTable
CREATE TABLE "pending_signups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_plan_id" UUID NOT NULL,
    "hotel_name" VARCHAR(150) NOT NULL,
    "owner_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "hesabpay_session_id" VARCHAR(150),
    "created_hotel_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(6),

    CONSTRAINT "pending_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_pending_signups_plan" ON "pending_signups"("subscription_plan_id");

-- CreateIndex
CREATE INDEX "idx_pending_signups_status" ON "pending_signups"("status");

-- AddForeignKey
ALTER TABLE "pending_signups" ADD CONSTRAINT "pending_signups_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
