-- Add targetQuantity for StockRequirement
ALTER TABLE "public"."StockRequirement"
ADD COLUMN IF NOT EXISTS "targetQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "StockRequirement_targetQuantity_idx" ON "public"."StockRequirement"("targetQuantity");