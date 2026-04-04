-- CreateTable
CREATE TABLE "stats_analytics_exclusions" (
    "exclusion_id" BIGSERIAL NOT NULL,
    "username_normalized" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(10),

    CONSTRAINT "stats_analytics_exclusions_pkey" PRIMARY KEY ("exclusion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stats_analytics_exclusions_username_normalized_key" ON "stats_analytics_exclusions"("username_normalized");
