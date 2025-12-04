"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tractor, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { getFarmers, createFarm, getFarms } from "../actions";

export default function FarmsPage() {
  const t = useTranslations('fieldAgent.farms');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [farmers, setFarmers] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadFarms() {
      try {
        const farmsData = await getFarms();
        setFarms(farmsData);
      } catch (error) {
        console.error('Error loading farms:', error);
      }
    }

    loadFarms();
  }, []);

  useEffect(() => {
    async function loadFarmers() {
      setLoading(true);
      try {
        const farmersData = await getFarmers();
        setFarmers(farmersData);
      } catch (error) {
        console.error('Error loading farmers:', error);
      } finally {
        setLoading(false);
      }
    }

    if (showCreateForm) {
      loadFarmers();
    }
  }, [showCreateForm]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      await createFarm(formData);
      setShowCreateForm(false);
      
      // Reload farms after creation
      const farmsData = await getFarms();
      setFarms(farmsData);
    } catch (error) {
      console.error('Error creating farm:', error);
      alert('Failed to create farm. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter farms based on search term
  const filteredFarms = farms.filter(farm =>
    farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farm.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farm.farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Tractor className="mr-2 h-4 w-4" />
          {t('addNewFarm')}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('addNewFarmTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farmerId">{t('farmer')}</Label>
                  <Select name="farmerId" required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectFarmer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>{t('loadingFarmers')}</SelectItem>
                      ) : farmers.length === 0 ? (
                        <SelectItem value="no-farmers" disabled>{t('noFarmersRegistered')}</SelectItem>
                      ) : (
                        farmers.map((farmer) => (
                          <SelectItem key={farmer.id} value={farmer.id}>
                            {farmer.name} - {farmer.farmerCode}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">{t('farmName')}</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder={t('farmNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="location">{t('location')}</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder={t('locationPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="area">{t('size')}</Label>
                  <Input
                    id="area"
                    name="area"
                    type="number"
                    step="0.01"
                    placeholder={t('sizePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="soilType">{t('soilType')}</Label>
                  <Input
                    id="soilType"
                    name="soilType"
                    placeholder={t('soilTypePlaceholder')}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('loading') : t('createFarm')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Farms Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('farmCode')}</TableHead>
                <TableHead>{t('farmName')}</TableHead>
                <TableHead>{t('farmer')}</TableHead>
                <TableHead>{t('location')}</TableHead>
                <TableHead>{t('size')}</TableHead>
                <TableHead>{t('soilType')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {searchTerm ? t('tryAdjustingSearch') : t('noFarmsFound')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFarms.map((farm) => (
                  <TableRow key={farm.id}>
                    <TableCell className="font-medium">{farm.farmCode}</TableCell>
                    <TableCell>{farm.name}</TableCell>
                    <TableCell>{farm.farmer.name}</TableCell>
                    <TableCell>{farm.location || "-"}</TableCell>
                    <TableCell>{farm.area ? `${farm.area} ha` : "-"}</TableCell>
                    <TableCell>{farm.soilType || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        {t('farmDetails')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
