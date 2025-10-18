-- Migration: Add Crop Batch Management Workflow
-- Date: 2025-10-13
-- Description: Adds TransportTask model updates, Notification model, and enum changes for crop batch workflow

-- First, add new enum values to existing enums
ALTER TYPE "TransportStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';

-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Update TransportTask table structure (only add missing columns)
-- First check if columns exist, then add them if they don't

-- Add warehouseId column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TransportTask' AND column_name = 'warehouseId'
    ) THEN
        ALTER TABLE "TransportTask" ADD COLUMN "warehouseId" UUID;
    END IF;
END $$;

-- Make vehicleId and driverId optional (nullable) if they aren't already
DO $$ 
BEGIN 
    -- Check if vehicleId is NOT NULL and make it nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TransportTask' 
        AND column_name = 'vehicleId' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "TransportTask" ALTER COLUMN "vehicleId" DROP NOT NULL;
    END IF;

    -- Check if driverId is NOT NULL and make it nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TransportTask' 
        AND column_name = 'driverId' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "TransportTask" ALTER COLUMN "driverId" DROP NOT NULL;
    END IF;
END $$;

-- Remove deliveryLocation column if it exists (not needed in new workflow)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TransportTask' AND column_name = 'deliveryLocation'
    ) THEN
        ALTER TABLE "TransportTask" DROP COLUMN "deliveryLocation";
    END IF;
END $$;

-- Add foreign key constraint for warehouse if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'TransportTask_warehouseId_fkey'
    ) THEN
        ALTER TABLE "TransportTask" ADD CONSTRAINT "TransportTask_warehouseId_fkey" 
        FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Update Warehouse table to include transportTasks relationship (no schema change needed, just Prisma relation)

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "TransportTask_warehouseId_idx" ON "TransportTask"("warehouseId");
CREATE INDEX IF NOT EXISTS "TransportTask_status_idx" ON "TransportTask"("status");
CREATE INDEX IF NOT EXISTS "TransportTask_coordinatorId_idx" ON "TransportTask"("coordinatorId");

-- Add triggers for updatedAt timestamp on Notification table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_notification_updated_at ON "Notification";
CREATE TRIGGER update_notification_updated_at
    BEFORE UPDATE ON "Notification"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample drivers and vehicles if they don't exist (for testing)
-- You can comment this out if you don't want sample data

-- Sample drivers
INSERT INTO "Driver" ("name", "licenseNumber", "phone", "email", "status") 
SELECT * FROM (VALUES 
    ('John Smith', 'DL001234567', '+1234567890', 'john.smith@transport.com', 'AVAILABLE'),
    ('Maria Garcia', 'DL002345678', '+1234567891', 'maria.garcia@transport.com', 'AVAILABLE'),
    ('David Johnson', 'DL003456789', '+1234567892', 'david.johnson@transport.com', 'AVAILABLE')
) AS v("name", "licenseNumber", "phone", "email", "status")
WHERE NOT EXISTS (
    SELECT 1 FROM "Driver" WHERE "licenseNumber" = v."licenseNumber"
);

-- Sample vehicles
INSERT INTO "Vehicle" ("plateNumber", "type", "capacity", "status") 
SELECT * FROM (VALUES 
    ('ABC-1234', 'TRUCK', 5000.0, 'AVAILABLE'),
    ('XYZ-5678', 'REFRIGERATED_TRUCK', 3000.0, 'AVAILABLE'),
    ('DEF-9012', 'VAN', 1500.0, 'AVAILABLE')
) AS v("plateNumber", "type", "capacity", "status")
WHERE NOT EXISTS (
    SELECT 1 FROM "Vehicle" WHERE "plateNumber" = v."plateNumber"
);

-- Sample warehouses (if none exist)
INSERT INTO "Warehouse" ("name", "code", "address", "city", "country", "capacity", "createdBy", "isActive") 
SELECT * FROM (VALUES 
    ('Central Warehouse', 'CW001', '123 Storage St', 'Springfield', 'USA', 100000, (SELECT "userId" FROM "Profile" WHERE "role" = 'admin' LIMIT 1), true),
    ('North Distribution Center', 'NDC002', '456 Logistics Ave', 'Northfield', 'USA', 75000, (SELECT "userId" FROM "Profile" WHERE "role" = 'admin' LIMIT 1), true),
    ('South Storage Facility', 'SSF003', '789 Warehouse Rd', 'Southtown', 'USA', 50000, (SELECT "userId" FROM "Profile" WHERE "role" = 'admin' LIMIT 1), true)
) AS v("name", "code", "address", "city", "country", "capacity", "createdBy", "isActive")
WHERE NOT EXISTS (
    SELECT 1 FROM "Warehouse" WHERE "code" = v."code"
) AND EXISTS (
    SELECT 1 FROM "Profile" WHERE "role" = 'admin'
);

-- Grant necessary permissions (adjust as needed for your setup)
-- These might not be needed depending on your Supabase setup
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "Notification" TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON "TransportTask" TO authenticated;

COMMIT;

-- Verification queries (run these after the migration to verify success)
-- SELECT COUNT(*) as notification_count FROM "Notification";
-- SELECT COUNT(*) as driver_count FROM "Driver";
-- SELECT COUNT(*) as vehicle_count FROM "Vehicle";
-- SELECT COUNT(*) as warehouse_count FROM "Warehouse";
-- 
-- -- Check TransportTask structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'TransportTask' 
-- ORDER BY ordinal_position;
--
-- -- Check enum values
-- SELECT unnest(enum_range(NULL::"TransportStatus")) as transport_status_values;