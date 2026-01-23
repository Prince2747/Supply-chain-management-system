import { prisma } from "@/lib/prisma";
import { UnitsManagementClient } from "./units-management-client";

export interface UnitOfMeasurement {
  id: string;
  name: string;
  code: string;
  category: string;
  baseUnit: string | null;
  conversionFactor: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

async function getUnits(): Promise<UnitOfMeasurement[]> {
  try {
    const units = await prisma.unitOfMeasurement.findMany({
      orderBy: { createdAt: "desc" },
    });

    return units.map((unit) => ({
      ...unit,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    }));
  } catch (error: unknown) {
    console.error("Error fetching units:", error);
    // Return empty array if database is not accessible
    return [];
  }
}

export async function UnitsManagement() {
  const units = await getUnits();

  return <UnitsManagementClient initialUnits={units} />;
}
