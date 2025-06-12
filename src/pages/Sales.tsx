
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, BarChart3, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSalesData } from "@/hooks/useSalesData";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";

export default function Sales() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [manualSale, setManualSale] = useState({
    nozzle_id: '',
    delta_volume_l: '',
    price_per_litre: '',
    total_amount: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: sales, isLoading } = useSalesData(selectedDate);
  const { currentStation, isOwner, isAdmin, isEmployee } = useRoleAccess();

  // Calculate totals
  const todayTotal = sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
  const todayVolume = sales?.reduce((sum, sale) => sum + (sale.delta_volume_l || 0), 0) || 0;

  // Add manual sale mutation
  const addSaleMutation = useMutation({
    mutationFn: async (saleData: typeof manualSale) => {
      if (!currentStation?.id) throw new Error('No station selected');

      const { data, error } = await supabase
        .from('sales')
        .insert({
          station_id: currentStation.id,
          nozzle_id: parseInt(saleData.nozzle_id),
          delta_volume_l: parseFloat(saleData.delta_volume_l),
          price_per_litre: parseFloat(saleData.price_per_litre),
          total_amount: parseFloat(saleData.total_amount),
          reading_id: null // Manual entry
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setIsAddSaleOpen(false);
      setManualSale({ nozzle_id: '', delta_volume_l: '', price_per_litre: '', total_amount: '' });
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

  const handleAddSale = () => {
    if (!manualSale.nozzle_id || !manualSale.delta_volume_l || !manualSale.price_per_litre || !manualSale.total_amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addSaleMutation.mutate(manualSale);
  };

  // Auto-calculate total amount when volume or price changes
  const handleVolumeOrPriceChange = (field: 'delta_volume_l' | 'price_per_litre', value: string) => {
    const updatedSale = { ...manualSale, [field]: value };
    
    if (updatedSale.delta_volume_l && updatedSale.price_per_litre) {
      const volume = parseFloat(updatedSale.delta_volume_l);
      const price = parseFloat(updatedSale.price_per_litre);
      if (!isNaN(volume) && !isNaN(price)) {
        updatedSale.total_amount = (volume * price).toFixed(2);
      }
    }
    
    setManualSale(updatedSale);
  };

  if (!currentStation && !isAdmin) {
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
        <div className="text-center">Loading sales data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground">
            Track and manage sales {currentStation ? `for ${currentStation.name}` : 'across all stations'}
          </p>
        </div>
        
        {(isOwner || isAdmin || isEmployee) && (
          <Dialog open={isAddSaleOpen} onOpenChange={setIsAddSaleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Manual Sale</DialogTitle>
                <DialogDescription>
                  Manually record a sale transaction
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nozzle_id">Nozzle ID</Label>
                  <Input
                    id="nozzle_id"
                    type="number"
                    value={manualSale.nozzle_id}
                    onChange={(e) => setManualSale(prev => ({ ...prev, nozzle_id: e.target.value }))}
                    placeholder="e.g., 1"
                  />
                </div>
                <div>
                  <Label htmlFor="delta_volume_l">Volume (Litres)</Label>
                  <Input
                    id="delta_volume_l"
                    type="number"
                    step="0.001"
                    value={manualSale.delta_volume_l}
                    onChange={(e) => handleVolumeOrPriceChange('delta_volume_l', e.target.value)}
                    placeholder="e.g., 25.5"
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_litre">Price per Litre (₹)</Label>
                  <Input
                    id="price_per_litre"
                    type="number"
                    step="0.01"
                    value={manualSale.price_per_litre}
                    onChange={(e) => handleVolumeOrPriceChange('price_per_litre', e.target.value)}
                    placeholder="e.g., 102.50"
                  />
                </div>
                <div>
                  <Label htmlFor="total_amount">Total Amount (₹)</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={manualSale.total_amount}
                    onChange={(e) => setManualSale(prev => ({ ...prev, total_amount: e.target.value }))}
                    placeholder="Auto-calculated"
                    readOnly
                  />
                </div>
                <Button onClick={handleAddSale} disabled={addSaleMutation.isPending} className="w-full">
                  {addSaleMutation.isPending ? 'Recording...' : 'Record Sale'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Date filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todayTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(selectedDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayVolume.toFixed(2)}L</div>
            <p className="text-xs text-muted-foreground">
              Fuel dispensed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales list */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions</CardTitle>
          <CardDescription>
            Recent sales for {new Date(selectedDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales && sales.length > 0 ? (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">Nozzle #{sale.nozzle_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">{sale.delta_volume_l.toFixed(2)}L</p>
                      <p className="text-sm text-muted-foreground">
                        @ ₹{sale.price_per_litre.toFixed(2)}/L
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{sale.total_amount.toFixed(2)}</p>
                    <Badge variant="outline">
                      {sale.reading_id ? 'OCR' : 'Manual'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sales found</h3>
              <p className="text-muted-foreground mb-4">
                No sales transactions for {new Date(selectedDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
