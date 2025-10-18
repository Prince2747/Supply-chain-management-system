-- Migration to sync database with Prisma schema
-- Generated on: 2025-10-15
-- This migration updates TransportTask table and TransportStatus enum

BEGIN;

-- Step 1: Check current enum values and add SCHEDULED if needed
DO $$ 
BEGIN
    -- Add SCHEDULED if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'SCHEDULED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransportStatus')
    ) THEN
        ALTER TYPE "TransportStatus" ADD VALUE 'SCHEDULED';
    END IF;
END $$;

-- Step 2: Create new enum type with only the values we want
DROP TYPE IF EXISTS "TransportStatus_new" CASCADE;
CREATE TYPE "TransportStatus_new" AS ENUM (
  'SCHEDULED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'DELAYED'
);

-- Step 3: Drop foreign key constraints temporarily
ALTER TABLE "public"."TransportTask" 
  DROP CONSTRAINT IF EXISTS "TransportTask_driverId_fkey";

ALTER TABLE "public"."TransportTask" 
  DROP CONSTRAINT IF EXISTS "TransportTask_vehicleId_fkey";

ALTER TABLE "public"."TransportTask" 
  DROP CONSTRAINT IF EXISTS "TransportTask_warehouseId_fkey";

-- Step 4: Alter TransportTask table - Remove default temporarily
ALTER TABLE "public"."TransportTask" 
  ALTER COLUMN "status" DROP DEFAULT;

-- Step 5: Convert column to new enum type with data migration
-- Map any old status values to new ones
ALTER TABLE "public"."TransportTask" 
  ALTER COLUMN "status" TYPE "TransportStatus_new" 
  USING (
    CASE 
      WHEN "status"::text = 'ASSIGNED' THEN 'SCHEDULED'::"TransportStatus_new"
      WHEN "status"::text IN ('SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DELAYED') 
        THEN "status"::text::"TransportStatus_new"
      ELSE 'SCHEDULED'::"TransportStatus_new"  -- Default fallback
    END
  );

-- Step 6: Replace old enum with new one
DROP TYPE "TransportStatus";
ALTER TYPE "TransportStatus_new" RENAME TO "TransportStatus";

-- Step 7: Set new default value
ALTER TABLE "public"."TransportTask" 
  ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

-- Step 6: Drop foreign key constraints that will be modified
ALTER TABLE "public"."TransportTask" 
  DROP CONSTRAINT IF EXISTS "TransportTask_driverId_fkey";

ALTER TABLE "public"."TransportTask" 
  DROP CONSTRAINT IF EXISTS "TransportTask_vehicleId_fkey";

ALTER TABLE "public"."TransportTask" 
  DROP CONSTRAINT IF EXISTS "TransportTask_warehouseId_fkey";

-- Step 7: Add new column and modify existing columns
-- Add deliveryLocation column
ALTER TABLE "public"."TransportTask" 
  ADD COLUMN IF NOT EXISTS "deliveryLocation" TEXT;

-- Update existing rows with a default delivery location
UPDATE "public"."TransportTask" 
SET "deliveryLocation" = COALESCE("pickupLocation", 'Warehouse Location')
WHERE "deliveryLocation" IS NULL;

-- Make deliveryLocation NOT NULL after updating existing rows
ALTER TABLE "public"."TransportTask" 
  ALTER COLUMN "deliveryLocation" SET NOT NULL;

-- Step 8: Make vehicleId and driverId NOT NULL
-- First, update any NULL values to prevent constraint violation
-- You may need to adjust this based on your data
UPDATE "public"."TransportTask" 
SET "vehicleId" = (SELECT id FROM "Vehicle" LIMIT 1)
WHERE "vehicleId" IS NULL;

UPDATE "public"."TransportTask" 
SET "driverId" = (SELECT id FROM "Driver" LIMIT 1)
WHERE "driverId" IS NULL;

-- Now make them NOT NULL
ALTER TABLE "public"."TransportTask" 
  ALTER COLUMN "vehicleId" SET NOT NULL;

ALTER TABLE "public"."TransportTask" 
  ALTER COLUMN "driverId" SET NOT NULL;

-- Step 9: Drop warehouseId column
ALTER TABLE "public"."TransportTask" 
  DROP COLUMN IF EXISTS "warehouseId";

-- Step 10: Re-add foreign key constraints
ALTER TABLE "public"."TransportTask" 
  ADD CONSTRAINT "TransportTask_driverId_fkey" 
  FOREIGN KEY ("driverId") 
  REFERENCES "public"."Driver"("id") 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

ALTER TABLE "public"."TransportTask" 
  ADD CONSTRAINT "TransportTask_vehicleId_fkey" 
  FOREIGN KEY ("vehicleId") 
  REFERENCES "public"."Vehicle"("id") 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

-- Step 11: Drop the Notification table if it exists
DROP TABLE IF EXISTS "public"."Notification";

COMMIT;

-- Note: This migration makes significant changes to the TransportTask table.
-- Before running this migration:
-- 1. Backup your database
-- 2. Review the UPDATE statements in Steps 7-8 to ensure they match your business logic
-- 3. Ensure you have at least one Vehicle and one Driver record if you have TransportTask records
-- 4. Test this migration on a staging environment first
