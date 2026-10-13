-- CreateTable
CREATE TABLE "tutorials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "language" VARCHAR(10) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "youtube_id" VARCHAR(50) NOT NULL,
    "duration" VARCHAR(20),
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutorials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_tutorials_language" ON "tutorials"("language");

-- CreateIndex
CREATE INDEX "idx_tutorials_active" ON "tutorials"("is_active");
