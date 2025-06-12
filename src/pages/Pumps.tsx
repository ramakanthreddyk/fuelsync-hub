
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Settings, Trash2, Fuel, Gauge } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Pump {
  id: number;
  pump_sno: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  location: string;
  installation_date: string;
  nozzles: Array<{
    id: number;
    nozzle_number: number;
    fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
    status: 'active' | 'inactive';
    max_flow_rate: number;
  }>;
}

export default function Pumps() {
  const [isAddPumpOpen, setIsAddPumpOpen] = useState(false);
  const [isAddNozzleOpen, setIsAddNozzleOpen] = useState(false);
  const [selectedPumpId, setSelectedPumpId] = useState<number | null>(null);
  const [newPump, setNewPump] = useState({
    pump_sno: '',
    name: '',
    location: '',
    status: 'active' as const
  });
  const [newNozzle, setNewNozzle] = useState({
    nozzle_number: '',
    fuel_type: 'PETROL' as const,
    max_flow_rate: '35.0',
    status: 'active' as const
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const currentStation = user?.stations?.[0];

  // Fetch pumps
  const { data: pumps, isLoading } = useQuery({
    queryKey: ['pumps', currentStation?.id],
    queryFn: async () => {
      if (!currentStation?.id) return [];
      
      const { data, error } = await supabase.functions.invoke('pumps-api', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data as Pump[];
    },
    enabled: !!currentStation?.id,
  });

  // Add pump mutation
  const addPumpMutation = useMutation({
    mutationFn: async (pumpData: typeof newPump) => {
      const { data, error } = await supabase.functions.invoke('pumps-api', {
        method: 'POST',
        body: {
          stationId: currentStation?.id,
          ...pumpData,
          created_by: user?.id
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
      setIsAddPumpOpen(false);
      setNewPump({ pump_sno: '', name: '', location: '', status: 'active' });
      toast({
        title: "Success",
        description: "Pump added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add pump",
        variant: "destructive",
      });
    },
  });

  // Add nozzle mutation
  const addNozzleMutation = useMutation({
    mutationFn: async (nozzleData: typeof newNozzle) => {
      const { data, error } = await supabase.functions.invoke('pumps-api', {
        method: 'POST',
        body: nozzleData,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
      setIsAddNozzleOpen(false);
      setSelectedPumpId(null);
      setNewNozzle({ nozzle_number: '', fuel_type: 'PETROL', max_flow_rate: '35.0', status: 'active' });
      toast({
        title: "Success",
        description: "Nozzle added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add nozzle",
        variant: "destructive",
      });
    },
  });

  const handleAddPump = () => {
    if (!newPump.pump_sno || !newPump.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in pump serial number and name",
        variant: "destructive",
      });
      return;
    }
    addPumpMutation.mutate(newPump);
  };

  const handleAddNozzle = () => {
    if (!newNozzle.nozzle_number || !selectedPumpId) {
      toast({
        title: "Missing Information",
        description: "Please fill in nozzle number",
        variant: "destructive",
      });
      return;
    }
    addNozzleMutation.mutate(newNozzle);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case 'PETROL': return 'bg-blue-100 text-blue-800';
      case 'DIESEL': return 'bg-orange-100 text-orange-800';
      case 'CNG': return 'bg-green-100 text-green-800';
      case 'EV': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentStation) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No station assigned to your account. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading pumps...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pump Management</h1>
          <p className="text-muted-foreground">Manage pumps and nozzles for {currentStation.name}</p>
        </div>
        
        <Dialog open={isAddPumpOpen} onOpenChange={setIsAddPumpOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Pump
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Pump</DialogTitle>
              <DialogDescription>
                Add a new pump to your station
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pump_sno">Pump Serial Number</Label>
                <Input
                  id="pump_sno"
                  value={newPump.pump_sno}
                  onChange={(e) => setNewPump(prev => ({ ...prev, pump_sno: e.target.value }))}
                  placeholder="e.g., P001"
                />
              </div>
              <div>
                <Label htmlFor="name">Pump Name</Label>
                <Input
                  id="name"
                  value={newPump.name}
                  onChange={(e) => setNewPump(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Pump 1"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newPump.location}
                  onChange={(e) => setNewPump(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Front - Left Side"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newPump.status} onValueChange={(value: any) => setNewPump(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddPump} disabled={addPumpMutation.isPending} className="w-full">
                {addPumpMutation.isPending ? 'Adding...' : 'Add Pump'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pumps?.map((pump) => (
          <Card key={pump.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Fuel className="w-5 h-5" />
                    {pump.name}
                  </CardTitle>
                  <CardDescription>
                    Serial: {pump.pump_sno} • {pump.location}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(pump.status)}>
                  {pump.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Installed: {new Date(pump.installation_date).toLocaleDateString()}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Nozzles ({pump.nozzles?.length || 0})</h4>
                  <Dialog open={isAddNozzleOpen && selectedPumpId === pump.id} onOpenChange={(open) => {
                    setIsAddNozzleOpen(open);
                    if (open) setSelectedPumpId(pump.id);
                    else setSelectedPumpId(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Nozzle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Nozzle to {pump.name}</DialogTitle>
                        <DialogDescription>
                          Add a new nozzle to this pump
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nozzle_number">Nozzle Number</Label>
                          <Input
                            id="nozzle_number"
                            type="number"
                            value={newNozzle.nozzle_number}
                            onChange={(e) => setNewNozzle(prev => ({ ...prev, nozzle_number: e.target.value }))}
                            placeholder="e.g., 1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fuel_type">Fuel Type</Label>
                          <Select value={newNozzle.fuel_type} onValueChange={(value: any) => setNewNozzle(prev => ({ ...prev, fuel_type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PETROL">Petrol</SelectItem>
                              <SelectItem value="DIESEL">Diesel</SelectItem>
                              <SelectItem value="CNG">CNG</SelectItem>
                              <SelectItem value="EV">EV Charging</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="max_flow_rate">Max Flow Rate (L/min)</Label>
                          <Input
                            id="max_flow_rate"
                            type="number"
                            step="0.1"
                            value={newNozzle.max_flow_rate}
                            onChange={(e) => setNewNozzle(prev => ({ ...prev, max_flow_rate: e.target.value }))}
                            placeholder="35.0"
                          />
                        </div>
                        <Button onClick={handleAddNozzle} disabled={addNozzleMutation.isPending} className="w-full">
                          {addNozzleMutation.isPending ? 'Adding...' : 'Add Nozzle'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-2">
                  {pump.nozzles?.map((nozzle) => (
                    <div key={nozzle.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        <span className="font-medium">#{nozzle.nozzle_number}</span>
                        <Badge className={getFuelTypeColor(nozzle.fuel_type)}>
                          {nozzle.fuel_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {nozzle.max_flow_rate} L/min
                        </span>
                        <Badge className={getStatusColor(nozzle.status)}>
                          {nozzle.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!pumps || pumps.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Fuel className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No pumps found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first pump to the station.
            </p>
            <Button onClick={() => setIsAddPumpOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Pump
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
