-- Essential Schema Changes for Crop Batch Workflow
-- Run this in Supabase SQL Editor
-- Date: 2025-10-13

BEGIN;

-- 1. Add ASSIGNED status to TransportStatus enum
ALTER TYPE "TransportStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';

-- 2. Create Notification table
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

-- 3. Update TransportTask table
-- Add warehouseId column
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TransportTask' AND column_name = 'warehouseId'
    ) THEN
        ALTER TABLE "TransportTask" ADD COLUMN "warehouseId" UUID;
    END IF;
END $$;

-- Make vehicleId and driverId nullable (optional until assigned)
ALTER TABLE "TransportTask" ALTER COLUMN "vehicleId" DROP NOT NULL;
ALTER TABLE "TransportTask" ALTER COLUMN "driverId" DROP NOT NULL;

-- 4. Add foreign key constraint for warehouse
ALTER TABLE "TransportTask" ADD CONSTRAINT "TransportTask_warehouseId_fkey" 
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Create necessary indexes
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "TransportTask_warehouseId_idx" ON "TransportTask"("warehouseId");
CREATE INDEX IF NOT EXISTS "TransportTask_status_idx" ON "TransportTask"("status");

-- 6. Add updatedAt trigger for Notification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_updated_at
    BEFORE UPDATE ON "Notification"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;