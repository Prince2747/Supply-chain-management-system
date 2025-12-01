"use client";

import { useState, useTransition } from "react";
import { Search, Plus, Edit, Trash2, Ruler } from "lucide-react";
import {
  createUnit,
  updateUnit,
  deleteUnit,
  toggleUnitStatus,
} from "@/app/[locale]/admin/units/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UnitOfMeasurement } from "./units-management";
import { useTranslations } from 'next-intl';

interface UnitsManagementClientProps {
  initialUnits: UnitOfMeasurement[];
}

const categories = [
  "weight",
  "volume",
  "length",
  "quantity",
  "area",
  "time",
  "temperature",
];

export function UnitsManagementClient({
  initialUnits,
}: UnitsManagementClientProps) {
  const t = useTranslations('admin.unitsPage');
  const [units, setUnits] = useState<UnitOfMeasurement[]>(initialUnits);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasurement | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  // Filter units based on search term and category
  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      !searchTerm ||
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || unit.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleCreateUnit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/units', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || 'Failed to create unit');
          return;
        }

        toast.success(result.message || 'Unit created successfully');
        setShowCreateForm(false);
        
        // Add the new unit to the local state instead of refreshing
        if (result.unit) {
          setUnits(prev => [result.unit, ...prev]);
        }
      } catch (error) {
        console.error('Error creating unit:', error);
        toast.error('Failed to create unit');
      }
    });
  };

  const handleEditUnit = async (formData: FormData) => {
    if (!editingUnit) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/units/${editingUnit.id}`, {
          method: 'PUT',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || 'Failed to update unit');
          return;
        }

        toast.success(result.message || 'Unit updated successfully');
        setEditingUnit(null);
        
        // Update the unit in local state instead of refreshing
        if (result.unit) {
          setUnits(prev => prev.map(unit => 
            unit.id === editingUnit.id ? result.unit : unit
          ));
        }
      } catch (error) {
        console.error('Error updating unit:', error);
        toast.error('Failed to update unit');
      }
    });
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this unit? This action cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/units/${unitId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || 'Failed to delete unit');
          return;
        }

        toast.success(result.message || 'Unit deleted successfully');
        
        // Remove the unit from local state instead of refreshing
        setUnits(prev => prev.filter(unit => unit.id !== unitId));
      } catch (error) {
        console.error('Error deleting unit:', error);
        toast.error('Failed to delete unit');
      }
    });
  };

  const handleToggleUnitStatus = async (unitId: string, isActive: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/units/${unitId}/toggle`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || 'Failed to update unit status');
          return;
        }

        toast.success(
          result.message ||
            `Unit ${isActive ? "activated" : "deactivated"} successfully`
        );
        
        // Update the unit status in local state instead of refreshing
        setUnits(prev => prev.map(unit => 
          unit.id === unitId ? { ...unit, isActive } : unit
        ));
      } catch (error) {
        console.error('Error toggling unit status:', error);
        toast.error('Failed to update unit status');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('units')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('addUnit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create/Edit Unit Form */}
          {(showCreateForm || editingUnit) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingUnit ? t('editUnit') : t('createNewUnit')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={editingUnit ? handleEditUnit : handleCreateUnit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">{t('unitName')}</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder={t('kilogram')}
                        defaultValue={editingUnit?.name || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="code">{t('unitCode')}</Label>
                      <Input
                        id="code"
                        name="code"
                        required
                        placeholder={t('kg')}
                        defaultValue={editingUnit?.code || ""}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">{t('category')}</Label>
                      <Select
                        name="category"
                        defaultValue={editingUnit?.category || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {t(category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="baseUnit">{t('baseUnit')}</Label>
                      <Input
                        id="baseUnit"
                        name="baseUnit"
                        placeholder={t('gram')}
                        defaultValue={editingUnit?.baseUnit || ""}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="conversionFactor">
                      {t('conversionFactor')}
                    </Label>
                    <Input
                      id="conversionFactor"
                      name="conversionFactor"
                      type="number"
                      step="0.000001"
                      placeholder="1000"
                      defaultValue={editingUnit?.conversionFactor || ""}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('conversionFactorHelp')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending
                        ? t('saving')
                        : editingUnit
                        ? t('updateUnit')
                        : t('createUnit')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingUnit(null);
                      }}
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
                placeholder={t('searchUnits')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Units Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('unit')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('baseUnit')}</TableHead>
                  <TableHead>{t('conversion')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t('noUnitsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Ruler className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{unit.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: {unit.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(unit.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{unit.baseUnit || t('none')}</TableCell>
                      <TableCell>
                        {unit.conversionFactor
                          ? `1 = ${unit.conversionFactor} ${unit.baseUnit}`
                          : t('na')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={unit.isActive ? "success" : "secondary"}
                        >
                          {unit.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(unit.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUnit(unit)}
                            disabled={isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleUnitStatus(unit.id, !unit.isActive)
                            }
                            disabled={isPending}
                          >
                            {unit.isActive ? t('deactivate') : t('activate')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUnit(unit.id)}
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
  );
}
