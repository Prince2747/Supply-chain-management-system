-- Add StockRequirement table for procurement min-stock thresholds
-- NOTE: This repo commits a generated Prisma client to lib/generated/prisma.
-- If you later add a matching Prisma model, run `npx prisma generate`.

CREATE TABLE IF NOT EXISTS "public"."StockRequirement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cropType" TEXT NOT NULL,
  "minStock" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'kg',
  "createdBy" UUID NOT NULL,
  "updatedBy" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StockRequirement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StockRequirement_cropType_key" ON "public"."StockRequirement"("cropType");
CREATE INDEX IF NOT EXISTS "StockRequirement_updatedAt_idx" ON "public"."StockRequirement"("updatedAt");
