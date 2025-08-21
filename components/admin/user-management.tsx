import { prisma } from "@/lib/prisma";
import { UserManagementClient } from "./user-management-client";

import { Role } from "@/lib/generated/prisma/client";

export interface User {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

async function getUsers(): Promise<User[]> {
  const users = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    ...user,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

export async function UserManagement() {
  const users = await getUsers();

  return <UserManagementClient initialUsers={users} />;
}
