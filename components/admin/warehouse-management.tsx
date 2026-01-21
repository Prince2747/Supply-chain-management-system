import { prisma } from '@/lib/prisma'
import { WarehouseManagementClient } from './warehouse-management-client'

export interface Warehouse {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  country: string | null
  capacity: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

async function getWarehouses(): Promise<Warehouse[]> {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return warehouses.map(warehouse => ({
      ...warehouse,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    }))
  } catch (error: unknown) {
    console.error('Error fetching warehouses:', error)
    // Return empty array if database is not accessible
    return []
  }
}

export async function WarehouseManagement() {
  const warehouses = await getWarehouses()
  
  return <WarehouseManagementClient initialWarehouses={warehouses} />
}
