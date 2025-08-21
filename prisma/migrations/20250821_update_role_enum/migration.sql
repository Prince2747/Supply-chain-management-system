-- AlterEnum
CREATE TYPE "Role_new" AS ENUM ('admin', 'manager', 'field_agent', 'procurement_officer', 'warehouse_manager', 'transport_driver');
ALTER TABLE "Profile" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
