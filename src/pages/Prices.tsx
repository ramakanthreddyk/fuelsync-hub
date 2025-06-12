
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
import { DollarSign, Plus, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFuelPricesData } from "@/hooks/useFuelPricesData";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/hooks/useAuth";

export default function Prices() {
  const [isAddPriceOpen, setIsAddPriceOpen] = useState(false);
  const [newPrice, setNewPrice] = useState({
    fuel_type: 'PETROL' as const,
    price_per_litre: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: fuelPrices, isLoading } = useFuelPricesData();
  const { currentStation, isOwner, isAdmin } = useRoleAccess();

  // Add price mutation
  const addPriceMutation = useMutation({
    mutationFn: async (priceData: typeof newPrice) => {
      if (!currentStation?.id) throw new Error('No station selected');

      const { data, error } = await supabase
        .from('fuel_prices')
        .insert({
          station_id: currentStation.id,
          fuel_type: priceData.fuel_type,
          price_per_litre: parseFloat(priceData.price_per_litre),
          created_by: user?.id,
          valid_from: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
      setIsAddPriceOpen(false);
      setNewPrice({ fuel_type: 'PETROL', price_per_litre: '' });
      toast({
        title: "Success",
        description: "Fuel price updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fuel price",
        variant: "destructive",
      });
    },
  });

  const handleAddPrice = () => {
    if (!newPrice.price_per_litre) {
      toast({
        title: "Missing Information",
        description: "Please enter the price per litre",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(newPrice.price_per_litre);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      return;
    }

    addPriceMutation.mutate(newPrice);
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
        <div className="text-center">Loading fuel prices...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fuel Prices</h1>
          <p className="text-muted-foreground">
            Manage fuel prices {currentStation ? `for ${currentStation.name}` : 'across all stations'}
          </p>
        </div>
        
        {(isOwner || isAdmin) && (
          <Dialog open={isAddPriceOpen} onOpenChange={setIsAddPriceOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Update Price
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Fuel Price</DialogTitle>
                <DialogDescription>
                  Set a new price for fuel type
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fuel_type">Fuel Type</Label>
                  <Select value={newPrice.fuel_type} onValueChange={(value: any) => setNewPrice(prev => ({ ...prev, fuel_type: value }))}>
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
                  <Label htmlFor="price_per_litre">Price per Litre (₹)</Label>
                  <Input
                    id="price_per_litre"
                    type="number"
                    step="0.01"
                    value={newPrice.price_per_litre}
                    onChange={(e) => setNewPrice(prev => ({ ...prev, price_per_litre: e.target.value }))}
                    placeholder="e.g., 102.50"
                  />
                </div>
                <Button onClick={handleAddPrice} disabled={addPriceMutation.isPending} className="w-full">
                  {addPriceMutation.isPending ? 'Updating...' : 'Update Price'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {fuelPrices?.map((price) => (
          <Card key={`${price.station_id}-${price.fuel_type}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    {price.fuel_type}
                  </CardTitle>
                  <CardDescription>
                    Current Price
                  </CardDescription>
                </div>
                <Badge className={getFuelTypeColor(price.fuel_type)}>
                  {price.fuel_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ₹{price.price_per_litre.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                <div>Updated: {new Date(price.valid_from).toLocaleDateString()}</div>
                <div>Valid from: {new Date(price.valid_from).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!fuelPrices || fuelPrices.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No fuel prices set</h3>
            <p className="text-muted-foreground mb-4">
              Get started by setting prices for different fuel types.
            </p>
            {(isOwner || isAdmin) && (
              <Button onClick={() => setIsAddPriceOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Set First Price
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
