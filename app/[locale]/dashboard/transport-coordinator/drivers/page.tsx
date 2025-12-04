"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  IdCard,
  CheckCircle,
  Clock,
  XCircle,
  Heart,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
import { getDrivers, createDriver, updateDriver, updateDriverStatus } from "../actions";

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: Date;
  transportTasks: any[];
}

export default function DriversPage() {
  const t = useTranslations("transportCoordinator.drivers");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (error) {
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (formData: FormData) => {
    try {
      const result = await createDriver(formData);
      if (result.success) {
        toast.success("Driver created successfully");
        setIsDialogOpen(false);
        loadDrivers();
      } else {
        toast.error(result.error || "Failed to create driver");
      }
    } catch (error) {
      toast.error("Failed to create driver");
    }
  };

  const handleUpdateDriver = async (formData: FormData) => {
    if (!editingDriver) return;
    
    try {
      const result = await updateDriver(editingDriver.id, formData);
      if (result.success) {
        toast.success("Driver updated successfully");
        setIsDialogOpen(false);
        setEditingDriver(null);
        loadDrivers();
      } else {
        toast.error(result.error || "Failed to update driver");
      }
    } catch (error) {
      toast.error("Failed to update driver");
    }
  };

  const handleStatusChange = async (driverId: string, status: string) => {
    try {
      const result = await updateDriverStatus(driverId, status);
      if (result.success) {
        toast.success("Driver status updated");
        loadDrivers();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update driver status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "ON_DUTY":
        return "bg-blue-100 text-blue-800";
      case "OFF_DUTY":
        return "bg-yellow-100 text-yellow-800";
      case "SICK_LEAVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle className="h-4 w-4" />;
      case "ON_DUTY":
        return <Clock className="h-4 w-4" />;
      case "OFF_DUTY":
        return <XCircle className="h-4 w-4" />;
      case "SICK_LEAVE":
        return <Heart className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingDriver(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDriver(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addDriver")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDriver ? t("editDriver") : t("addNewDriver")}</DialogTitle>
              <DialogDescription>
                {editingDriver ? t("editDriverDescription") : t("addDriverDescription")}
              </DialogDescription>
            </DialogHeader>
            <form action={editingDriver ? handleUpdateDriver : handleCreateDriver} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("driverName")}</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingDriver?.name || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{t("licenseNumber")}</Label>
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  defaultValue={editingDriver?.licenseNumber || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phoneNumber")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={editingDriver?.phone || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailAddress")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingDriver?.email || ""}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingDriver(null);
                }}>
                  {t("cancel")}
                </Button>
                <Button type="submit">{editingDriver ? t("updateDriver") : t("createDriver")}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("driverList")}</CardTitle>
          <CardDescription>
            {t("allDrivers")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("license")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("tasks")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4 text-muted-foreground" />
                      {driver.licenseNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {driver.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    {driver.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {driver.email}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(driver.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(driver.status)}
                        {driver.status.replace('_', ' ')}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {driver.transportTasks.length > 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {driver.transportTasks[0].cropBatch.batchNumber} - {driver.transportTasks[0].vehicle.plateNumber}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No active task</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingDriver(driver);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Select
                        value={driver.status}
                        onValueChange={(status) => handleStatusChange(driver.id, status)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="ON_DUTY">On Duty</SelectItem>
                          <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {drivers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No drivers</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first driver.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
