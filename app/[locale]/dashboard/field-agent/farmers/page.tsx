"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  zone: string | null;
  woreda: string | null;
  kebele: string | null;
  gender: string | null;
  farmerType: string | null;
  country: string | null;
  farmerId: string;
  isActive: boolean;
  createdAt: Date;
  farms: { id: string; name: string; farmCode: string }[];
  _count: { farms: number; cropBatches: number };
}

export default function FarmersPage() {
  const t = useTranslations('fieldAgent.farmers');
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
    farmer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        toast.success(t('farmerCreatedSuccess'));
        setIsCreateDialogOpen(false);
        loadFarmers();
        (event.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || t('farmerCreatedError'));
      }
    } catch (error) {
      toast.error(t('farmerCreatedError'));
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
        toast.success(t('farmerUpdatedSuccess'));
        setIsEditDialogOpen(false);
        setEditingFarmer(null);
        loadFarmers();
      } else {
        toast.error(result.error || t('farmerUpdatedError'));
      }
    } catch (error) {
      toast.error(t('farmerUpdatedError'));
    }
  };

  const handleDeleteFarmer = async (farmerId: string, farmerName: string) => {
    if (confirm(t('deleteConfirm', { name: farmerName }))) {
      try {
        const result = await deleteFarmer(farmerId);
        if (result.success) {
          toast.success(t('farmerDeletedSuccess'));
          loadFarmers();
        } else {
          toast.error(result.error || t('farmerDeletedError'));
        }
      } catch (error) {
        toast.error(t('farmerDeletedError'));
      }
    }
  };

  const openEditDialog = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('addFarmer')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addNewFarmer')}</DialogTitle>
              <DialogDescription>
                {t('addNewFarmerDesc')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFarmer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select name="gender" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farmerType">Farmer Type *</Label>
                  <Select name="farmerType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farmer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNAL_FARMER">Internal Farmer</SelectItem>
                      <SelectItem value="OUTGROWER_FARMER">Outgrower Farmer</SelectItem>
                      <SelectItem value="EXTERNAL_FARMER">External Farmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (+251...) *</Label>
                  <Input id="phone" name="phone" required placeholder="+2519XXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input id="email" name="email" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('address')}</Label>
                <Input id="address" name="address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <Select name="region" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'Addis Ababa',
                        'Afar',
                        'Amhara',
                        'Benishangul-Gumuz',
                        'Dire Dawa',
                        'Gambella',
                        'Harari',
                        'Oromia',
                        'Sidama',
                        'Somali',
                        'South West Ethiopia',
                        'SNNPR',
                        'Tigray',
                      ].map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone">Zone</Label>
                  <Input id="zone" name="zone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="woreda">Woreda</Label>
                  <Input id="woreda" name="woreda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kebele">Kebele</Label>
                  <Input id="kebele" name="kebele" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('city')}</Label>
                  <Input id="city" name="city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t('state')}</Label>
                  <Input id="state" name="state" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">{t('country')}</Label>
                  <Input id="country" name="country" defaultValue="Ethiopia" readOnly />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('createFarmer')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalFarmers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmers.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('activeRegistrations')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalFarms')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farmers.reduce((sum, farmer) => sum + farmer._count.farms, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('registeredFarms')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cropBatches')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farmers.reduce((sum, farmer) => sum + farmer._count.cropBatches, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('activeBatches')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('farmersDirectory')}</CardTitle>
              <CardDescription>
                {t('farmersDirectoryDesc')}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
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
                <TableHead>{t('farmerId')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('contact')}</TableHead>
                <TableHead>{t('location')}</TableHead>
                <TableHead>{t('farms')}</TableHead>
                <TableHead>{t('batches')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
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
              <h3 className="mt-2 text-sm font-semibold text-gray-900">{t('noFarmersFound')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? t('tryAdjustingSearch') : t('noFarmersFoundDesc')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editFarmer')}</DialogTitle>
            <DialogDescription>
              {t('editFarmerDesc')}
            </DialogDescription>
          </DialogHeader>
          {editingFarmer && (
            <form onSubmit={handleUpdateFarmer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name *</Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    defaultValue={editingFarmer.firstName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name *</Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    defaultValue={editingFarmer.lastName}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender *</Label>
                  <Select name="gender" defaultValue={editingFarmer.gender || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-farmerType">Farmer Type *</Label>
                  <Select name="farmerType" defaultValue={editingFarmer.farmerType || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farmer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNAL_FARMER">Internal Farmer</SelectItem>
                      <SelectItem value="OUTGROWER_FARMER">Outgrower Farmer</SelectItem>
                      <SelectItem value="EXTERNAL_FARMER">External Farmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone (+251...) *</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    defaultValue={editingFarmer.phone || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">{t('email')}</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingFarmer.email || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">{t('address')}</Label>
                <Input
                  id="edit-address"
                  name="address"
                  defaultValue={editingFarmer.address || ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-region">Region *</Label>
                  <Select name="region" defaultValue={editingFarmer.region || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'Addis Ababa',
                        'Afar',
                        'Amhara',
                        'Benishangul-Gumuz',
                        'Dire Dawa',
                        'Gambella',
                        'Harari',
                        'Oromia',
                        'Sidama',
                        'Somali',
                        'South West Ethiopia',
                        'SNNPR',
                        'Tigray',
                      ].map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-zone">Zone</Label>
                  <Input
                    id="edit-zone"
                    name="zone"
                    defaultValue={editingFarmer.zone || ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-woreda">Woreda</Label>
                  <Input
                    id="edit-woreda"
                    name="woreda"
                    defaultValue={editingFarmer.woreda || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-kebele">Kebele</Label>
                  <Input
                    id="edit-kebele"
                    name="kebele"
                    defaultValue={editingFarmer.kebele || ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">{t('city')}</Label>
                  <Input
                    id="edit-city"
                    name="city"
                    defaultValue={editingFarmer.city || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">{t('state')}</Label>
                  <Input
                    id="edit-state"
                    name="state"
                    defaultValue={editingFarmer.state || ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-country">{t('country')}</Label>
                  <Input
                    id="edit-country"
                    name="country"
                    defaultValue={editingFarmer.country || "Ethiopia"}
                    readOnly
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
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('updateFarmer')}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
