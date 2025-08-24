/*
  Warnings:

  - The values [user] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CropBatchStatus" AS ENUM ('PLANTED', 'GROWING', 'READY_FOR_HARVEST', 'HARVESTED', 'PROCESSED', 'SHIPPED');

-- CreateEnum
CREATE TYPE "public"."InspectionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('HARVEST_READY', 'INSPECTION_DUE', 'PEST_ALERT', 'WEATHER_WARNING', 'GENERAL');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('admin', 'manager', 'field_agent', 'procurement_officer', 'warehouse_manager', 'transport_driver');
ALTER TABLE "public"."Profile" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."Profile" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."Profile" ALTER COLUMN "role" SET DEFAULT 'field_agent';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Profile" ALTER COLUMN "role" SET DEFAULT 'field_agent';

-- CreateTable
CREATE TABLE "public"."Warehouse" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UnitOfMeasurement" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "baseUnit" TEXT,
    "conversionFactor" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID NOT NULL,

    CONSTRAINT "UnitOfMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" UUID,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Farmer" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "farmerId" TEXT NOT NULL,
    "registeredBy" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Farm" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "farmCode" TEXT NOT NULL,
    "farmerId" UUID NOT NULL,
    "location" TEXT,
    "coordinates" TEXT,
    "area" DOUBLE PRECISION,
    "soilType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CropBatch" (
    "id" UUID NOT NULL,
    "batchCode" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "variety" TEXT,
    "plantingDate" TIMESTAMP(3),
    "expectedHarvest" TIMESTAMP(3),
    "actualHarvest" TIMESTAMP(3),
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "farmId" UUID NOT NULL,
    "farmerId" UUID NOT NULL,
    "status" "public"."CropBatchStatus" NOT NULL DEFAULT 'PLANTED',
    "qrCode" TEXT,
    "notes" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FarmInspection" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "inspectedBy" UUID NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "cropCondition" TEXT,
    "soilHealth" TEXT,
    "pestIssues" TEXT,
    "recommendations" TEXT,
    "photos" TEXT[],
    "status" "public"."InspectionStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HarvestNotification" (
    "id" UUID NOT NULL,
    "cropBatchId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" "public"."NotificationType" NOT NULL DEFAULT 'HARVEST_READY',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentTo" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HarvestNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "public"."Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasurement_code_key" ON "public"."UnitOfMeasurement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_email_key" ON "public"."Farmer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_farmerId_key" ON "public"."Farmer"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "Farm_farmCode_key" ON "public"."Farm"("farmCode");

-- CreateIndex
CREATE UNIQUE INDEX "CropBatch_batchCode_key" ON "public"."CropBatch"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "CropBatch_qrCode_key" ON "public"."CropBatch"("qrCode");

-- AddForeignKey
ALTER TABLE "public"."Farm" ADD CONSTRAINT "Farm_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "public"."Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CropBatch" ADD CONSTRAINT "CropBatch_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "public"."Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CropBatch" ADD CONSTRAINT "CropBatch_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "public"."Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FarmInspection" ADD CONSTRAINT "FarmInspection_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "public"."Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HarvestNotification" ADD CONSTRAINT "HarvestNotification_cropBatchId_fkey" FOREIGN KEY ("cropBatchId") REFERENCES "public"."CropBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
