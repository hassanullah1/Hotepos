/*
  Warnings:

  - You are about to drop the column `features` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `is_rooms` on the `subscription_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "features",
DROP COLUMN "is_rooms";

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_sections" (
    "plan_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB DEFAULT '{}',

    CONSTRAINT "plan_sections_pkey" PRIMARY KEY ("plan_id","section_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sections_key_key" ON "sections"("key");

-- CreateIndex
CREATE INDEX "idx_sections_active" ON "sections"("is_active");

-- CreateIndex
CREATE INDEX "idx_plan_sections_section" ON "plan_sections"("section_id");

-- AddForeignKey
ALTER TABLE "plan_sections" ADD CONSTRAINT "plan_sections_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_sections" ADD CONSTRAINT "plan_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
