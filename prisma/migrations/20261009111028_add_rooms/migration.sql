-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "room_stay_id" UUID;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "room_stay_id" UUID,
ALTER COLUMN "order_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "shifts" ALTER COLUMN "closing_cash" SET DEFAULT 0,
ALTER COLUMN "expected_cash" SET DEFAULT 0,
ALTER COLUMN "variance" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "room_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "room_number" VARCHAR(20) NOT NULL,
    "floor" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'available',
    "notes" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_stays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "customer_id" UUID,
    "guest_name" VARCHAR(150),
    "guest_phone" VARCHAR(30),
    "guest_id_no" VARCHAR(60),
    "check_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_check_out" DATE,
    "actual_check_out" TIMESTAMPTZ(6),
    "rate_per_night" DECIMAL(12,2) NOT NULL,
    "nights" INTEGER NOT NULL DEFAULT 1,
    "rent_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "orders_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_by" UUID,
    "checked_out_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_stays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_room_types_branch" ON "room_types"("branch_id");

-- CreateIndex
CREATE INDEX "idx_rooms_branch" ON "rooms"("branch_id");

-- CreateIndex
CREATE INDEX "idx_rooms_status" ON "rooms"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_branch_id_room_number_key" ON "rooms"("branch_id", "room_number");

-- CreateIndex
CREATE INDEX "idx_stays_branch" ON "room_stays"("branch_id");

-- CreateIndex
CREATE INDEX "idx_stays_room" ON "room_stays"("room_id");

-- CreateIndex
CREATE INDEX "idx_stays_status" ON "room_stays"("status");

-- CreateIndex
CREATE INDEX "idx_orders_room_stay" ON "orders"("room_stay_id");

-- CreateIndex
CREATE INDEX "idx_payments_room_stay" ON "payments"("room_stay_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_room_stay_id_fkey" FOREIGN KEY ("room_stay_id") REFERENCES "room_stays"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_room_stay_id_fkey" FOREIGN KEY ("room_stay_id") REFERENCES "room_stays"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_stays" ADD CONSTRAINT "room_stays_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_stays" ADD CONSTRAINT "room_stays_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_stays" ADD CONSTRAINT "room_stays_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_stays" ADD CONSTRAINT "room_stays_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_stays" ADD CONSTRAINT "room_stays_checked_out_by_fkey" FOREIGN KEY ("checked_out_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
