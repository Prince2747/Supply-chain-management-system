-- Update existing 'user' roles to 'field_agent'
UPDATE "Profile" SET role = 'field_agent' WHERE role = 'user';

-- Now create the new enum and update the column
CREATE TYPE "Role_new" AS ENUM ('admin', 'manager', 'field_agent', 'procurement_officer', 'warehouse_manager', 'transport_driver');
ALTER TABLE "Profile" 
  ALTER COLUMN role TYPE "Role_new" 
  USING (
    CASE role::text
      WHEN 'user' THEN 'field_agent'::text
      ELSE role::text
    END
  )::"Role_new";
DROP TYPE IF EXISTS "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
