"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { createFarmer, getFarmers, updateFarmer, deleteFarmer } from "../actions";
import { toast } from "sonner";

interface Farmer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  farmerId: string;
  isActive: boolean;
  createdAt: Date;
  farms: { id: string; name: string; farmCode: string }[];
  _count: { farms: number; cropBatches: number };
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);

  // Load farmers
  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    try {
      const farmersData = await getFarmers();
      setFarmers(farmersData);
    } catch (error) {
      toast.error("Failed to load farmers");
    } finally {
      setLoading(false);
    }
  };

  // Filter farmers based on search term
  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone?.includes(searchTerm)
  );

  const handleCreateFarmer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await createFarmer(formData);
      if (result.success) {
        toast.success("Farmer created successfully");
        setIsCreateDialogOpen(false);
        loadFarmers();
        (event.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || "Failed to create farmer");
      }
    } catch (error) {
      toast.error("Failed to create farmer");
    }
  };

  const handleUpdateFarmer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    if (editingFarmer) {
      formData.append('id', editingFarmer.id);
    }
    
    try {
      const result = await updateFarmer(formData);
      if (result.success) {
        toast.success("Farmer updated successfully");
        setIsEditDialogOpen(false);
        setEditingFarmer(null);
        loadFarmers();
      } else {
        toast.error(result.error || "Failed to update farmer");
      }
    } catch (error) {
      toast.error("Failed to update farmer");
    }
  };

  const handleDeleteFarmer = async (farmerId: string, farmerName: string) => {
    if (confirm(`Are you sure you want to delete farmer "${farmerName}"?`)) {
      try {
        const result = await deleteFarmer(farmerId);
        if (result.success) {
          toast.success("Farmer deleted successfully");
          loadFarmers();
        } else {
          toast.error(result.error || "Failed to delete farmer");
        }
      } catch (error) {
        toast.error("Failed to delete farmer");
      }
    }
  };

  const openEditDialog = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farmer Management</h1>
          <p className="text-muted-foreground">
            Register and manage farmer profiles
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Farmer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
              <DialogDescription>
                Register a new farmer in the system. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFarmer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Farmer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active registrations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farmers.reduce((sum, farmer) => sum + farmer._count.farms, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered farms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crop Batches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farmers.reduce((sum, farmer) => sum + farmer._count.cropBatches, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active batches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Farmers Directory</CardTitle>
              <CardDescription>
                Manage all registered farmers and their information
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search farmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Farms</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmers.map((farmer) => (
                <TableRow key={farmer.id}>
                  <TableCell>
                    <Badge variant="outline">{farmer.farmerId}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{farmer.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {farmer.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-1 h-3 w-3" />
                          {farmer.email}
                        </div>
                      )}
                      {farmer.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-1 h-3 w-3" />
                          {farmer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {farmer.city || farmer.state ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {[farmer.city, farmer.state].filter(Boolean).join(", ")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{farmer._count.farms}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{farmer._count.cropBatches}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(farmer)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFarmer(farmer.id, farmer.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredFarmers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No farmers found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "Get started by adding your first farmer."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Farmer</DialogTitle>
            <DialogDescription>
              Update farmer information. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {editingFarmer && (
            <form onSubmit={handleUpdateFarmer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input 
                    id="edit-name" 
                    name="name" 
                    defaultValue={editingFarmer.name}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    name="email" 
                    type="email"
                    defaultValue={editingFarmer.email || ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input 
                    id="edit-phone" 
                    name="phone"
                    defaultValue={editingFarmer.phone || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input 
                    id="edit-city" 
                    name="city"
                    defaultValue={editingFarmer.city || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input 
                  id="edit-address" 
                  name="address"
                  defaultValue={editingFarmer.address || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input 
                    id="edit-state" 
                    name="state"
                    defaultValue={editingFarmer.state || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Input 
                    id="edit-country" 
                    name="country"
                    defaultValue={editingFarmer.country || ""}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingFarmer(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Farmer</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
