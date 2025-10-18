-- Fix ActivityLog trigger issue
-- The trigger function is trying to insert without generating proper UUIDs

-- First, check if the trigger exists and drop it
DROP TRIGGER IF EXISTS log_user_status_change_trigger ON "Profile";

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS log_user_status_change();

-- Option 1: Update ActivityLog to use database-generated UUIDs
-- This changes the default from Prisma client-side to database-side generation
ALTER TABLE "ActivityLog" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Option 2: Create a new, properly working trigger function (if you still want automatic logging)
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when isActive field changes
    IF OLD."isActive" IS DISTINCT FROM NEW."isActive" THEN
        INSERT INTO "ActivityLog" (
            "id",              -- Explicitly provide UUID
            "userId",
            "action",
            "entityType",
            "entityId",
            "details",
            "createdAt"
        ) VALUES (
            gen_random_uuid(), -- Generate UUID in database
            NEW."userId",
            CASE 
                WHEN NEW."isActive" = true THEN 'USER_REACTIVATED_AUTO'
                ELSE 'USER_DEACTIVATED_AUTO'
            END,
            'USER',
            NEW."userId",
            json_build_object(
                'previousStatus', OLD."isActive",
                'newStatus', NEW."isActive",
                'userEmail', NEW."email",
                'userName', NEW."name",
                'triggeredBy', 'database_trigger'
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger (optional - only if you want automatic logging)
-- Comment out the next line if you don't want the trigger
-- CREATE TRIGGER log_user_status_change_trigger
--     AFTER UPDATE ON "Profile"
--     FOR EACH ROW
--     EXECUTE FUNCTION log_user_status_change();

-- Verify the fix by checking the table structure
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'ActivityLog' 
AND column_name = 'id';