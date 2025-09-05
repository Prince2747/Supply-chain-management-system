"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Star, TrendingUp, TrendingDown } from "lucide-react";

interface DriverPerformance {
  id: string;
  name: string;
  tasksCount: number;
  completedTasks: number;
  issuesCount: number;
  onTimeRate: number;
}

interface DriverPerformanceTableProps {
  data: DriverPerformance[];
}

export function DriverPerformanceTable({ data }: DriverPerformanceTableProps) {
  const getPerformanceRating = (onTimeRate: number, issuesCount: number, tasksCount: number) => {
    const issueRate = tasksCount > 0 ? (issuesCount / tasksCount) * 100 : 0;
    
    if (onTimeRate >= 95 && issueRate <= 5) return { rating: "Excellent", color: "text-green-600", stars: 5 };
    if (onTimeRate >= 85 && issueRate <= 10) return { rating: "Good", color: "text-blue-600", stars: 4 };
    if (onTimeRate >= 75 && issueRate <= 15) return { rating: "Average", color: "text-yellow-600", stars: 3 };
    if (onTimeRate >= 65 && issueRate <= 25) return { rating: "Below Average", color: "text-orange-600", stars: 2 };
    return { rating: "Needs Improvement", color: "text-red-600", stars: 1 };
  };

  const getCompletionBadge = (completed: number, total: number) => {
    const rate = total > 0 ? (completed / total) * 100 : 0;
    if (rate >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rate >= 75) return <Badge variant="default" className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rate >= 60) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Average</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < count ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No driver performance data available
      </div>
    );
  }

  // Sort drivers by overall performance (on-time rate and low issue count)
  const sortedData = [...data].sort((a, b) => {
    const aScore = a.onTimeRate - (a.issuesCount / Math.max(a.tasksCount, 1)) * 10;
    const bScore = b.onTimeRate - (b.issuesCount / Math.max(b.tasksCount, 1)) * 10;
    return bScore - aScore;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>On-Time Rate</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((driver, index) => {
            const performance = getPerformanceRating(driver.onTimeRate, driver.issuesCount, driver.tasksCount);
            const completionRate = driver.tasksCount > 0 ? (driver.completedTasks / driver.tasksCount) * 100 : 0;
            
            return (
              <TableRow key={driver.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {index < 3 && (
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? "bg-yellow-500" :
                        index === 1 ? "bg-gray-400" :
                        "bg-orange-600"
                      }`} />
                    )}
                    <span className="font-medium">{driver.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{driver.tasksCount}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{driver.completedTasks}</span>
                    {getCompletionBadge(driver.completedTasks, driver.tasksCount)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{driver.issuesCount}</span>
                    {driver.issuesCount === 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : driver.issuesCount <= 2 ? (
                      <TrendingUp className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{Math.round(driver.onTimeRate)}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          driver.onTimeRate >= 85 ? "bg-green-500" :
                          driver.onTimeRate >= 70 ? "bg-yellow-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(driver.onTimeRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${performance.color}`}>
                      {performance.rating}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {renderStars(performance.stars)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Performance Legend */}
      <div className="p-4 bg-gray-50 border-t">
        <h4 className="text-sm font-medium mb-2">Performance Ratings</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            {renderStars(5)}
            <span>Excellent (95%+ on-time, ≤5% issues)</span>
          </div>
          <div className="flex items-center space-x-1">
            {renderStars(4)}
            <span>Good (85%+ on-time, ≤10% issues)</span>
          </div>
          <div className="flex items-center space-x-1">
            {renderStars(3)}
            <span>Average (75%+ on-time, ≤15% issues)</span>
          </div>
          <div className="flex items-center space-x-1">
            {renderStars(2)}
            <span>Below Average (65%+ on-time, ≤25% issues)</span>
          </div>
          <div className="flex items-center space-x-1">
            {renderStars(1)}
            <span>Needs Improvement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
