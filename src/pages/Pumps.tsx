
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { Pump, Nozzle } from '@/types/api';
import { useToast } from "@/hooks/use-toast";
import MetricCard from '@/components/MetricCard';

const Pumps = () => {
  const [editingNozzle, setEditingNozzle] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pumpsData, isLoading } = useQuery({
    queryKey: ['pumps'],
    queryFn: async () => {
      const response = await apiService.getPumps();
      return response.data || [];
    }
  });

  const updatePumpStatusMutation = useMutation({
    mutationFn: ({ pumpId, status }: { pumpId: string; status: string }) => 
      apiService.updatePumpStatus(pumpId, status),
    onSuccess: () => {
      toast({
        title: "Pump Status Updated",
        description: "Pump status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
    }
  });

  const updateNozzleMutation = useMutation({
    mutationFn: ({ nozzleId, fuelType }: { nozzleId: string; fuelType: string }) => 
      apiService.updateNozzleFuelType(nozzleId, fuelType),
    onSuccess: () => {
      toast({
        title: "Nozzle Updated",
        description: "Nozzle configuration has been updated successfully.",
      });
      setEditingNozzle(null);
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '🔴';
      case 'maintenance':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const totalPumps = pumpsData?.length || 0;
  const activePumps = pumpsData?.filter(pump => pump.status === 'active').length || 0;
  const totalSales = pumpsData?.reduce((sum, pump) => sum + pump.totalSalesToday, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pump Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage your fuel pumps and nozzle configurations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Pumps"
          value={totalPumps}
          subtitle={`${activePumps} active`}
          icon="⛽"
        />
        
        <MetricCard
          title="Pump Efficiency"
          value="94.5%"
          subtitle="Average uptime"
          icon="📊"
          trend={{ value: 2.1, label: 'vs last week', direction: 'up' }}
        />
        
        <MetricCard
          title="Today's Sales"
          value={`₹${totalSales.toLocaleString()}`}
          subtitle="across all pumps"
          icon="💰"
          trend={{ value: 8.7, label: 'vs yesterday', direction: 'up' }}
        />
      </div>

      {/* Pump Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 text-center py-8">
            <span className="text-2xl">⏳</span>
            <p className="text-muted-foreground mt-2">Loading pumps...</p>
          </div>
        ) : (
          pumpsData?.map((pump: Pump) => (
            <Card key={pump.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⛽</span>
                    <span>{pump.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(pump.status)}>
                      {getStatusIcon(pump.status)} {pump.status}
                    </Badge>
                    <Select
                      value={pump.status}
                      onValueChange={(status) => updatePumpStatusMutation.mutate({ pumpId: pump.id, status })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
                <CardDescription>
                  Last maintenance: {new Date(pump.lastMaintenanceDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Pump Sales Summary */}
                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Today's Sales</span>
                    <span className="text-lg font-bold text-primary">₹{pump.totalSalesToday.toLocaleString()}</span>
                  </div>
                </div>

                {/* Nozzles Grid */}
                <div>
                  <h4 className="font-medium mb-3">Nozzles Configuration</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {pump.nozzles.map((nozzle: Nozzle) => (
                      <div 
                        key={nozzle.id} 
                        className="p-3 border rounded-lg bg-background hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Nozzle {nozzle.number}</span>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(nozzle.status)}
                          >
                            {getStatusIcon(nozzle.status)}
                          </Badge>
                        </div>
                        
                        {editingNozzle === nozzle.id ? (
                          <div className="space-y-2">
                            <Select
                              value={nozzle.fuelType}
                              onValueChange={(fuelType) => 
                                updateNozzleMutation.mutate({ nozzleId: nozzle.id, fuelType })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Petrol">⛽ Petrol</SelectItem>
                                <SelectItem value="Diesel">🚛 Diesel</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => setEditingNozzle(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {nozzle.fuelType === 'Petrol' ? '⛽' : '🚛'}
                              </span>
                              <span className="text-sm">{nozzle.fuelType}</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-full text-xs"
                              onClick={() => setEditingNozzle(nozzle.id)}
                            >
                              Edit Fuel Type
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <span className="mr-1">🔧</span>
                    Maintenance
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <span className="mr-1">📊</span>
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔧</span>
            System Health
          </CardTitle>
          <CardDescription>
            Overall pump system status and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="font-medium text-sm">Fuel Supply</p>
                <p className="text-xs text-muted-foreground">Normal levels</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="font-medium text-sm">Network Connection</p>
                <p className="text-xs text-muted-foreground">All pumps connected</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <div>
                <p className="font-medium text-sm">Maintenance Due</p>
                <p className="text-xs text-muted-foreground">Pump 3 in 5 days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pumps;
