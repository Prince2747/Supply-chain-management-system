"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  User, 
  Truck, 
  MoreHorizontal,
  Eye,
  Edit,
  AlertTriangle,
  Search,
  Filter
} from "lucide-react";

interface Task {
  id: string;
  status: string;
  scheduledDate: Date;
  actualPickupDate?: Date | null;
  actualDeliveryDate?: Date | null;
  pickupLocation: string;
  deliveryLocation: string;
  notes?: string | null;
  cropBatch: {
    batchCode: string;
    cropType: string;
    quantity: number | null;
    farm: {
      name: string;
    };
  };
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    plateNumber: string;
    type: string;
  };
  coordinator: {
    name: string | null;
  };
  issues: any[];
}

interface Stats {
  total: number;
  scheduled: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  delayed: number;
  withIssues: number;
}

interface TransportTasksClientProps {
  tasks: Task[];
  stats: Stats;
}

export function TransportTasksClient({ tasks, stats }: TransportTasksClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [issuesFilter, setIssuesFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      IN_TRANSIT: { label: "In Transit", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      DELIVERED: { label: "Delivered", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800 hover:bg-red-100" },
      DELAYED: { label: "Delayed", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, className: "bg-gray-100 text-gray-800 hover:bg-gray-100" };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.cropBatch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.cropBatch.farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    
    const matchesIssues = issuesFilter === "all" || 
                         (issuesFilter === "with-issues" && task.issues.length > 0) ||
                         (issuesFilter === "no-issues" && task.issues.length === 0);
    
    return matchesSearch && matchesStatus && matchesIssues;
  });

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transport tasks</h3>
        <p className="text-gray-500 mb-4">
          Transport tasks will appear here once they are scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by batch code, farm, driver, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="DELAYED">Delayed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={issuesFilter} onValueChange={setIssuesFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Issues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="with-issues">With Issues</SelectItem>
            <SelectItem value="no-issues">No Issues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="border rounded-lg p-6 hover:shadow-sm transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-semibold text-lg">{task.cropBatch.batchCode}</h3>
                  {getStatusBadge(task.status)}
                  {task.issues.length > 0 && (
                    <Badge variant="destructive" className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{task.issues.length} issue{task.issues.length > 1 ? 's' : ''}</span>
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {task.cropBatch.cropType} • {task.cropBatch.farm.name} • {task.cropBatch.quantity || 0}kg
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Task
                  </DropdownMenuItem>
                  {task.issues.length > 0 && (
                    <DropdownMenuItem>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      View Issues
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Task Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Scheduled</span>
                </div>
                <div className="font-medium">
                  {format(new Date(task.scheduledDate), "PPP")}
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center text-muted-foreground">
                  <User className="h-4 w-4 mr-1" />
                  <span>Driver</span>
                </div>
                <div className="font-medium truncate">{task.driver.name}</div>
                <div className="text-xs text-muted-foreground truncate">{task.driver.phone}</div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center text-muted-foreground">
                  <Truck className="h-4 w-4 mr-1" />
                  <span>Vehicle</span>
                </div>
                <div className="font-medium truncate">{task.vehicle.plateNumber}</div>
                <div className="text-xs text-muted-foreground truncate">{task.vehicle.type.replace('_', ' ')}</div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center text-muted-foreground">
                  <User className="h-4 w-4 mr-1" />
                  <span>Coordinator</span>
                </div>
                <div className="font-medium truncate">{task.coordinator.name || "Not assigned"}</div>
              </div>
            </div>

            {/* Locations */}
            <div className="mt-4 space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-green-700 text-sm">Pickup:</span>
                  <p className="text-sm text-muted-foreground">{task.pickupLocation}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-red-700 text-sm">Delivery:</span>
                  <p className="text-sm text-muted-foreground">{task.deliveryLocation}</p>
                </div>
              </div>
            </div>

            {/* Status Timestamps */}
            {(task.actualPickupDate || task.actualDeliveryDate) && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {task.actualPickupDate && (
                    <div>
                      <span className="text-muted-foreground">Picked up:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(task.actualPickupDate), "PPp")}
                      </span>
                    </div>
                  )}
                  {task.actualDeliveryDate && (
                    <div>
                      <span className="text-muted-foreground">Delivered:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(task.actualDeliveryDate), "PPp")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {task.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm">
                  <span className="font-medium text-muted-foreground">Notes:</span>
                  <span className="ml-2">{task.notes}</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks match your filters</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters to see more results.
          </p>
        </div>
      )}
    </div>
  );
}