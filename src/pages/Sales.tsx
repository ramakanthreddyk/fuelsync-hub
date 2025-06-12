
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
import { Plus, TrendingUp, DollarSign, Fuel, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Sale {
  id: number;
  delta_volume_l: number;
  price_per_litre: number;
  total_amount: number;
  shift: 'morning' | 'afternoon' | 'night';
  fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
  is_manual_entry: boolean;
  created_at: string;
  pumps: { pump_sno: string; name: string };
  nozzles: { nozzle_number: number; fuel_type: string };
  users: { name: string };
}

interface Pump {
  id: number;
  pump_sno: string;
  name: string;
  nozzles: Array<{
    id: number;
    nozzle_number: number;
    fuel_type: string;
  }>;
}

export default function Sales() {
  const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
  const [manualSale, setManualSale] = useState({
    pumpId: '',
    nozzleId: '',
    litres: '',
    fuelType: 'PETROL' as const,
    pricePerLitre: '',
    shift: 'morning' as const
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const currentStation = user?.stations?.[0];

  // Fetch sales
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', currentStation?.id],
    queryFn: async () => {
      if (!currentStation?.id) return [];
      
      const { data, error } = await supabase.functions.invoke('sales-api', {
        method: 'GET',
        body: null,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data as Sale[];
    },
    enabled: !!currentStation?.id,
  });

  // Fetch pumps for manual sale
  const { data: pumps } = useQuery({
    queryKey: ['pumps', currentStation?.id],
    queryFn: async () => {
      if (!currentStation?.id) return [];
      
      const { data, error } = await supabase.functions.invoke('pumps-api', {
        method: 'GET',
        body: null,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data as Pump[];
    },
    enabled: !!currentStation?.id && isManualSaleOpen,
  });

  // Fetch daily summary
  const { data: dailySummary } = useQuery({
    queryKey: ['daily-summary', currentStation?.id],
    queryFn: async () => {
      if (!currentStation?.id) return null;
      
      const { data, error } = await supabase.functions.invoke('sales-api', {
        method: 'GET',
        body: null,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    enabled: !!currentStation?.id,
  });

  // Add manual sale mutation
  const addManualSaleMutation = useMutation({
    mutationFn: async (saleData: typeof manualSale) => {
      const { data, error } = await supabase.functions.invoke('sales-api', {
        method: 'POST',
        body: {
          stationId: currentStation?.id,
          ...saleData,
          enteredBy: user?.id
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      setIsManualSaleOpen(false);
      setManualSale({
        pumpId: '',
        nozzleId: '',
        litres: '',
        fuelType: 'PETROL',
        pricePerLitre: '',
        shift: 'morning'
      });
      toast({
        title: "Success",
        description: "Manual sale recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record sale",
        variant: "destructive",
      });
    },
  });

  const handleAddManualSale = () => {
    if (!manualSale.pumpId || !manualSale.nozzleId || !manualSale.litres || !manualSale.pricePerLitre) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addManualSaleMutation.mutate(manualSale);
  };

  const selectedPump = pumps?.find(p => p.id.toString() === manualSale.pumpId);
  const availableNozzles = selectedPump?.nozzles || [];

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'morning': return 'bg-yellow-100 text-yellow-800';
      case 'afternoon': return 'bg-orange-100 text-orange-800';
      case 'night': return 'bg-blue-100 text-blue-800';
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground">Track and manage sales for {currentStation.name}</p>
        </div>
        
        <Dialog open={isManualSaleOpen} onOpenChange={setIsManualSaleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Manual Sale Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Sale Entry</DialogTitle>
              <DialogDescription>
                Record a manual sale when OCR processing fails
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pump">Select Pump</Label>
                <Select value={manualSale.pumpId} onValueChange={(value) => setManualSale(prev => ({ ...prev, pumpId: value, nozzleId: '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pump" />
                  </SelectTrigger>
                  <SelectContent>
                    {pumps?.map((pump) => (
                      <SelectItem key={pump.id} value={pump.id.toString()}>
                        {pump.name} ({pump.pump_sno})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nozzle">Select Nozzle</Label>
                <Select 
                  value={manualSale.nozzleId} 
                  onValueChange={(value) => setManualSale(prev => ({ ...prev, nozzleId: value }))}
                  disabled={!manualSale.pumpId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a nozzle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNozzles.map((nozzle) => (
                      <SelectItem key={nozzle.id} value={nozzle.id.toString()}>
                        Nozzle #{nozzle.nozzle_number} ({nozzle.fuel_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="litres">Litres</Label>
                  <Input
                    id="litres"
                    type="number"
                    step="0.001"
                    value={manualSale.litres}
                    onChange={(e) => setManualSale(prev => ({ ...prev, litres: e.target.value }))}
                    placeholder="25.750"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerLitre">Price per Litre</Label>
                  <Input
                    id="pricePerLitre"
                    type="number"
                    step="0.01"
                    value={manualSale.pricePerLitre}
                    onChange={(e) => setManualSale(prev => ({ ...prev, pricePerLitre: e.target.value }))}
                    placeholder="102.50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select value={manualSale.fuelType} onValueChange={(value: any) => setManualSale(prev => ({ ...prev, fuelType: value }))}>
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
                  <Label htmlFor="shift">Shift</Label>
                  <Select value={manualSale.shift} onValueChange={(value: any) => setManualSale(prev => ({ ...prev, shift: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {manualSale.litres && manualSale.pricePerLitre && (
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-lg font-bold">
                      ₹{(parseFloat(manualSale.litres) * parseFloat(manualSale.pricePerLitre)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Button onClick={handleAddManualSale} disabled={addManualSaleMutation.isPending} className="w-full">
                {addManualSaleMutation.isPending ? 'Recording...' : 'Record Sale'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{sales?.filter(s => s.created_at.startsWith(new Date().toISOString().split('T')[0]))
                    .reduce((sum, s) => sum + s.total_amount, 0).toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Litres</CardTitle>
                <Fuel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sales?.filter(s => s.created_at.startsWith(new Date().toISOString().split('T')[0]))
                    .reduce((sum, s) => sum + s.delta_volume_l, 0).toFixed(2) || '0.00'} L
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sales?.filter(s => s.created_at.startsWith(new Date().toISOString().split('T')[0])).length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Sale</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{sales?.filter(s => s.created_at.startsWith(new Date().toISOString().split('T')[0])).length 
                    ? (sales.filter(s => s.created_at.startsWith(new Date().toISOString().split('T')[0]))
                        .reduce((sum, s) => sum + s.total_amount, 0) / 
                       sales.filter(s => s.created_at.startsWith(new Date().toISOString().split('T')[0])).length)
                        .toFixed(2) 
                    : '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest sales transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="text-center py-4">Loading sales...</div>
              ) : sales && sales.length > 0 ? (
                <div className="space-y-4">
                  {sales.slice(0, 20).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{sale.pumps?.name || 'Unknown Pump'}</span>
                          <Badge className={getFuelTypeColor(sale.fuel_type)}>
                            {sale.fuel_type}
                          </Badge>
                          <Badge className={getShiftColor(sale.shift)}>
                            {sale.shift}
                          </Badge>
                          {sale.is_manual_entry && (
                            <Badge variant="outline">Manual</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sale.delta_volume_l.toFixed(3)} L @ ₹{sale.price_per_litre.toFixed(2)}/L
                          • Nozzle #{sale.nozzles?.nozzle_number}
                          • {sale.users?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sale.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">₹{sale.total_amount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sales found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start recording sales through OCR uploads or manual entry.
                  </p>
                  <Button onClick={() => setIsManualSaleOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Record First Sale
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
