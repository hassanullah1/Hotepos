-- CreateTable
CREATE TABLE "business_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_types_key_key" ON "business_types"("key");

-- CreateIndex
CREATE INDEX "idx_business_types_active" ON "business_types"("is_active");
