
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import MetricCard from '@/components/MetricCard';

export default function Pumps() {
  const [selectedPump, setSelectedPump] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentStation = user?.stations?.[0];

  const { data: pumpsResponse, isLoading } = useQuery({
    queryKey: ['pumps', currentStation?.id],
    queryFn: async () => {
      if (!currentStation) return { data: [] };
      return await apiService.getPumps(currentStation.id);
    },
    enabled: !!currentStation
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiService.updatePumpStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
      toast({
        title: "Success",
        description: "Pump status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pump status",
        variant: "destructive",
      });
    }
  });

  const updateFuelTypeMutation = useMutation({
    mutationFn: ({ id, fuelType }: { id: string; fuelType: string }) =>
      apiService.updateNozzleFuelType(id, fuelType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
      toast({
        title: "Success",
        description: "Nozzle fuel type updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fuel type",
        variant: "destructive",
      });
    }
  });

  const pumps = pumpsResponse?.data || [];

  const activePumps = pumps.filter(pump => pump.status === 'active').length;
  const totalNozzles = pumps.reduce((sum, pump) => sum + (pump.nozzles?.length || 0), 0);
  const activeNozzles = pumps.reduce((sum, pump) => 
    sum + (pump.nozzles?.filter(n => n.status === 'active').length || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <span className="text-4xl">⏳</span>
          <p className="text-muted-foreground mt-2">Loading pumps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pump Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage your fuel pumps and nozzles.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Pumps"
          value={activePumps}
          subtitle={`of ${pumps.length} total`}
          icon="⛽"
          trend={{ value: 0, label: 'all operational', direction: 'neutral' }}
          gradient
        />
        
        <MetricCard
          title="Total Nozzles"
          value={totalNozzles}
          subtitle={`${activeNozzles} active`}
          icon="🔧"
        />
        
        <MetricCard
          title="Maintenance Due"
          value={0}
          subtitle="pumps need service"
          icon="🔧"
        />
        
        <MetricCard
          title="Today's Sales"
          value="₹0"
          subtitle="across all pumps"
          icon="💰"
        />
      </div>

      {/* Pumps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pumps.map((pump) => (
          <Card key={pump.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pump.name || `Pump ${pump.id}`}</CardTitle>
                <Badge variant="outline" className={getStatusColor(pump.status)}>
                  {pump.status}
                </Badge>
              </div>
              <CardDescription>
                Last maintenance: {pump.lastMaintenanceDate ? new Date(pump.lastMaintenanceDate).toLocaleDateString() : 'Never'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pump Status Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pump Status</span>
                <Switch
                  checked={pump.status === 'active'}
                  onCheckedChange={(checked) => 
                    updateStatusMutation.mutate({ id: pump.id, isActive: checked })
                  }
                  disabled={updateStatusMutation.isPending}
                />
              </div>

              {/* Nozzles */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Nozzles ({pump.nozzles?.length || 0})</h4>
                {pump.nozzles && pump.nozzles.length > 0 ? (
                  pump.nozzles.map((nozzle) => (
                    <div key={nozzle.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">N{nozzle.number}</span>
                        <Badge variant={nozzle.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {nozzle.status}
                        </Badge>
                      </div>
                      <Select
                        value={nozzle.fuelType}
                        onValueChange={(value) => 
                          updateFuelTypeMutation.mutate({ id: nozzle.id, fuelType: value })
                        }
                        disabled={updateFuelTypeMutation.isPending}
                      >
                        <SelectTrigger className="w-20 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Petrol">Petrol</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No nozzles configured</p>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">₹0</p>
                    <p className="text-xs text-muted-foreground">Today's Sales</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">0L</p>
                    <p className="text-xs text-muted-foreground">Fuel Sold</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Maintenance
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pumps.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <span className="text-4xl">⛽</span>
            <p className="text-muted-foreground mt-2">No pumps configured</p>
            <p className="text-sm text-muted-foreground">Add pumps to start managing your fuel station</p>
            <Button className="mt-4">Add First Pump</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
