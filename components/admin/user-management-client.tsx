'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, UserPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createUser, updateUserRole, deleteUser } from '@/app/admin/users/actions'
import { User } from './user-management'
import { Role } from '@/lib/generated/prisma/client'

interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string | null;
}

interface UserManagementClientProps {
  initialUsers: User[]
  warehouses: Warehouse[]
}

export function UserManagementClient({ initialUsers, warehouses }: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  // Remove local message state, use Sonner toast instead

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        // Validate role
        const role = formData.get('role');
        if (!role || !['field_agent', 'warehouse_manager', 'transport_coordinator', 'procurement_officer', 'admin'].includes(role as string)) {
          toast.error('Please select a valid role');
          return;
        }

        const result = await createUser(formData);
        
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('User created successfully');
          setShowCreateForm(false);
          
          // Add the new user to local state instead of refreshing
          if (result.user) {
            setUsers(prevUsers => [...prevUsers, result.user]);
          }
        }
      } catch (error) {
        toast.error('Failed to create user');
      }
    });
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    startTransition(async () => {
      const validRoles = [
        'admin',
        'manager',
        'field_agent',
        'procurement_officer',
        'warehouse_manager',
        'transport_driver',
        'transport_coordinator'
      ]
      if (!validRoles.includes(newRole)) {
        toast.error('Invalid role. Must be one of: ' + validRoles.join(', '))
        return
      }
      const result = await updateUserRole(userId, newRole)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message || 'Role updated successfully')
        setUsers(users.map(user => 
          user.userId === userId ? { ...user, role: newRole } : user
        ))
      }
    })
  }

  const handleWarehouseAssignment = async (userId: string, warehouseId: string | null) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/assign-warehouse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, warehouseId }),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || 'Failed to assign warehouse');
          return;
        }

        toast.success('Warehouse assignment updated successfully');
        
        // Update the local state
        setUsers(users.map(user => {
          if (user.userId === userId) {
            const assignedWarehouse = warehouseId 
              ? warehouses.find(w => w.id === warehouseId) 
              : null;
            return { 
              ...user, 
              warehouseId,
              warehouse: assignedWarehouse ? {
                id: assignedWarehouse.id,
                name: assignedWarehouse.name,
                code: assignedWarehouse.code,
              } : null
            };
          }
          return user;
        }));
      } catch (error) {
        toast.error('Failed to assign warehouse');
      }
    });
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.message || 'User deleted successfully')
        setUsers(users.filter(user => user.userId !== userId))
      }
    })
  }

  return (
    <div className="space-y-6">


      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create User Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        required 
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        type="text" 
                        placeholder="Full Name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        required 
                        placeholder="Temporary password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select name="role" required defaultValue="field_agent">
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="field_agent">Field Agent</SelectItem>
                          <SelectItem value="procurement_officer">Procurement Officer</SelectItem>
                          <SelectItem value="warehouse_manager">Warehouse Manager</SelectItem>
                          <SelectItem value="transport_driver">Transport Driver</SelectItem>
                          <SelectItem value="transport_coordinator">Transport Coordinator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? 'Creating...' : 'Create User'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value: 'all' | Role) => setRoleFilter(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="field_agent">Field Agent</SelectItem>
                <SelectItem value="procurement_officer">Procurement Officer</SelectItem>
                <SelectItem value="warehouse_manager">Warehouse Manager</SelectItem>
                <SelectItem value="transport_driver">Transport Driver</SelectItem>
                <SelectItem value="transport_coordinator">Transport Coordinator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.userId.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'field_agent' ? 'Field Agent' :
                           user.role === 'procurement_officer' ? 'Procurement Officer' :
                           user.role === 'warehouse_manager' ? 'Warehouse Manager' :
                           user.role === 'transport_driver' ? 'Transport Driver' :
                           user.role === 'transport_coordinator' ? 'Transport Coordinator' :
                           user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'warehouse_manager' && user.warehouse ? (
                          <div>
                            <div className="font-medium">{user.warehouse.name}</div>
                            <div className="text-sm text-muted-foreground">Code: {user.warehouse.code}</div>
                          </div>
                        ) : user.role === 'warehouse_manager' ? (
                          <Badge variant="outline" className="text-orange-600">
                            Not Assigned
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole: Role) => handleRoleChange(user.userId, newRole)}
                            disabled={isPending}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="field_agent">Field Agent</SelectItem>
                              <SelectItem value="procurement_officer">Procurement Officer</SelectItem>
                              <SelectItem value="warehouse_manager">Warehouse Manager</SelectItem>
                              <SelectItem value="transport_driver">Transport Driver</SelectItem>
                              <SelectItem value="transport_coordinator">Transport Coordinator</SelectItem>
                            </SelectContent>
                          </Select>
                          {user.role === 'warehouse_manager' && (
                            <Select
                              value={user.warehouseId || 'none'}
                              onValueChange={(warehouseId: string) => handleWarehouseAssignment(user.userId, warehouseId === 'none' ? null : warehouseId)}
                              disabled={isPending}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Assign Warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Warehouse</SelectItem>
                                {warehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name} ({warehouse.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.userId)}
                            disabled={isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
