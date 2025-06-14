
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface AlertBadgesProps {
  variance: number;
  pendingClosures: number;
  lastReading: string | null;
}

export const AlertBadges: React.FC<AlertBadgesProps> = ({ 
  variance, 
  pendingClosures, 
  lastReading 
}) => {
  const alerts = [];

  // Sales vs Collections variance alert
  const varianceThreshold = 100; // ₹100
  if (Math.abs(variance) > varianceThreshold) {
    alerts.push({
      type: 'warning',
      icon: AlertTriangle,
      message: `Sales-Collections variance: ₹${Math.abs(variance).toFixed(2)}`,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    });
  }

  // Pending closures alert
  if (pendingClosures > 0) {
    alerts.push({
      type: 'info',
      icon: Clock,
      message: `${pendingClosures} pending closure${pendingClosures > 1 ? 's' : ''}`,
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    });
  }

  // Last reading alert (if no reading in last 4 hours)
  if (lastReading) {
    const lastReadingTime = new Date(lastReading);
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    
    if (lastReadingTime < fourHoursAgo) {
      alerts.push({
        type: 'warning',
        icon: AlertTriangle,
        message: `No readings in ${Math.floor((Date.now() - lastReadingTime.getTime()) / (60 * 60 * 1000))} hours`,
        color: 'bg-orange-100 text-orange-800 border-orange-300'
      });
    }
  }

  // All good badge
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      icon: CheckCircle,
      message: 'All systems operational',
      color: 'bg-green-100 text-green-800 border-green-300'
    });
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">System Status</h3>
      <div className="flex flex-wrap gap-2">
        {alerts.map((alert, index) => (
          <Badge key={index} variant="outline" className={`${alert.color} flex items-center gap-1`}>
            <alert.icon className="h-3 w-3" />
            {alert.message}
          </Badge>
        ))}
      </div>
    </div>
  );
};
