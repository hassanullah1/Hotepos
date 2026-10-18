-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "province_id" UUID;

-- CreateTable
CREATE TABLE "provinces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "provinces"("name");

-- CreateIndex
CREATE INDEX "idx_branches_province" ON "branches"("province_id");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
