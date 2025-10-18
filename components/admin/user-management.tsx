import { prisma } from "@/lib/prisma";
import { UserManagementClient } from "./user-management-client";

import { Role } from "@/lib/generated/prisma/client";

export interface User {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  role: Role;
  warehouseId: string | null;
  isActive: boolean;
  warehouse: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

async function getUsers(): Promise<User[]> {
  const users = await prisma.profile.findMany({
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
          code: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    ...user,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

async function getWarehouses() {
  return await prisma.warehouse.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function UserManagement() {
  const users = await getUsers();
  const warehouses = await getWarehouses();

  return <UserManagementClient initialUsers={users} warehouses={warehouses} />;
}
