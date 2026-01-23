'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, UserPlus, UserCheck, UserX } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createUser, updateUserRole, deactivateUser, reactivateUser } from '@/app/[locale]/admin/users/actions'
import { User } from './user-management'
import { Role } from '@/lib/generated/prisma/client'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('admin.usersPage');
  const tRoles = useTranslations('admin.roles');
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    confirmText: string
    confirmVariant: 'default' | 'destructive'
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmVariant: 'default'
  })

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

    const email = (formData.get('email') || '').toString().trim();
    const name = (formData.get('name') || '').toString().trim();
    const password = (formData.get('password') || '').toString();
    const role = (formData.get('role') || '').toString();

    if (!email) {
      toast.error('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!password) {
      toast.error('Password is required');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!name) {
      toast.error('Name is required');
      return;
    }

    if (!role) {
      toast.error('Role is required');
      return;
    }
    
    startTransition(async () => {
      try {
        // Validate role
        // Validate role
        if (!['field_agent', 'warehouse_manager', 'transport_coordinator', 'procurement_officer', 'admin', 'manager', 'transport_driver'].includes(role)) {
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

  const handleToggleUserStatus = async (userEmail: string, isActive: boolean) => {
    const action = isActive ? 'deactivate' : 'reactivate'
    
    if (!userEmail) {
      toast.error('Cannot modify user: Email address is required')
      return
    }
    
    // Show custom confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User Account`,
      description: `Are you sure you want to ${action} this user account? ${isActive ? 'The user will no longer be able to log in.' : 'The user will be able to log in again.'}`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      confirmVariant: isActive ? 'destructive' : 'default',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        startTransition(async () => {
          const result = isActive 
            ? await deactivateUser(userEmail)
            : await reactivateUser(userEmail)
          
          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success(result.message || `User ${action}d successfully`)
            setUsers(users.map(user => 
              user.email === userEmail 
                ? { ...user, isActive: !isActive }
                : user
            ))
          }
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.confirmVariant}
              onClick={confirmDialog.onConfirm}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : confirmDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('users')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t('addUser')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create User Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('createNewUser')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fields marked with * are required.
                </p>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">{t('email')} *</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        required 
                        placeholder="user@example.com"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Must be a valid email (include @).
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="name">{t('name')} *</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        type="text" 
                        required
                        placeholder={t('fullName')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">{t('password')} *</Label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        required 
                        placeholder={t('temporaryPassword')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">{t('role')} *</Label>
                      <Select name="role" required defaultValue="field_agent">
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectRole')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{tRoles('admin')}</SelectItem>
                          <SelectItem value="manager">{tRoles('manager')}</SelectItem>
                          <SelectItem value="field_agent">{tRoles('field_agent')}</SelectItem>
                          <SelectItem value="procurement_officer">{tRoles('procurement_officer')}</SelectItem>
                          <SelectItem value="warehouse_manager">{tRoles('warehouse_manager')}</SelectItem>
                          <SelectItem value="transport_driver">{tRoles('transport_driver')}</SelectItem>
                          <SelectItem value="transport_coordinator">{tRoles('transport_coordinator')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? t('creating') : t('createUser')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      {t('cancel')}
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
                  <TableHead>{t('user')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead>{t('warehouse')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('noUsersFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || t('noName')}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.userId.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {tRoles(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'warehouse_manager' && user.warehouse ? (
                          <div>
                            <div className="font-medium">{user.warehouse.name}</div>
                            <div className="text-sm text-muted-foreground">{t('code')}: {user.warehouse.code}</div>
                          </div>
                        ) : user.role === 'warehouse_manager' ? (
                          <Badge variant="outline" className="text-orange-600">
                            {t('notAssigned')}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{t('na')}</span>
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
                            variant={user.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.email || '', user.isActive)}
                            disabled={isPending || !user.email}
                            className={user.isActive ? 
                              "bg-red-600 hover:bg-red-700 text-white border-red-600" : 
                              "bg-green-600 hover:bg-green-700 text-white border-green-600"
                            }
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Reactivate
                              </>
                            )}
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
