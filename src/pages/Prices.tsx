
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { FuelPrice } from '@/types/api';
import { useToast } from "@/hooks/use-toast";

const Prices = () => {
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrices, setNewPrices] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pricesData, isLoading } = useQuery({
    queryKey: ['fuel-prices'],
    queryFn: async () => {
      const response = await apiService.getFuelPrices();
      return response.data || [];
    }
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ fuelType, price }: { fuelType: string; price: number }) => 
      apiService.updateFuelPrice(fuelType, price),
    onSuccess: () => {
      toast({
        title: "Price Updated",
        description: "Fuel price has been updated successfully.",
      });
      setEditingPrice(null);
      setNewPrices({});
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update fuel price. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleStartEdit = (fuelType: string, currentPrice: number) => {
    setEditingPrice(fuelType);
    setNewPrices({ ...newPrices, [fuelType]: currentPrice.toString() });
  };

  const handleSavePrice = (fuelType: string) => {
    const newPrice = parseFloat(newPrices[fuelType]);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    updatePriceMutation.mutate({ fuelType, price: newPrice });
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setNewPrices({});
  };

  const getFuelIcon = (fuelType: string) => {
    return fuelType === 'Petrol' ? '⛽' : '🚛';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fuel Prices</h1>
          <p className="text-muted-foreground mt-1">
            Manage and update fuel prices for your station.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-sm">
          Last updated: {pricesData?.[0]?.updatedAt ? new Date(pricesData[0].updatedAt).toLocaleDateString() : 'N/A'}
        </Badge>
      </div>

      {/* Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 text-center py-8">
            <span className="text-2xl">⏳</span>
            <p className="text-muted-foreground mt-2">Loading fuel prices...</p>
          </div>
        ) : (
          pricesData?.map((price: FuelPrice) => (
            <Card key={price.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getFuelIcon(price.fuelType)}</span>
                    <span>{price.fuelType}</span>
                  </div>
                  <Badge variant="secondary">Current Rate</Badge>
                </CardTitle>
                <CardDescription>
                  Price per litre • Updated by {price.updatedBy}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {editingPrice === price.fuelType ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`price-${price.fuelType}`}>Price per Litre (₹)</Label>
                      <Input
                        id={`price-${price.fuelType}`}
                        type="number"
                        step="0.01"
                        value={newPrices[price.fuelType] || ''}
                        onChange={(e) => setNewPrices({ 
                          ...newPrices, 
                          [price.fuelType]: e.target.value 
                        })}
                        placeholder="Enter new price"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleSavePrice(price.fuelType)}
                        disabled={updatePriceMutation.isPending}
                        className="flex-1"
                      >
                        {updatePriceMutation.isPending ? 'Saving...' : 'Save Price'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <div className="text-4xl font-bold text-primary">
                        ₹{price.price.toFixed(2)}
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">per litre</p>
                    </div>
                    
                    <Button 
                      onClick={() => handleStartEdit(price.fuelType, price.price)}
                      className="w-full"
                      variant="outline"
                    >
                      Update Price
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Price History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📈</span>
            Price History
          </CardTitle>
          <CardDescription>
            Recent fuel price changes and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <span className="text-4xl">📊</span>
            <p className="text-muted-foreground mt-2">Price history coming soon</p>
            <p className="text-sm text-muted-foreground">Track price changes over time</p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span>
            Pricing Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <h4 className="font-medium text-primary mb-2">Competitive Pricing</h4>
              <p className="text-sm text-muted-foreground">
                Monitor local market rates to stay competitive while maintaining profitability.
              </p>
            </div>
            
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <h4 className="font-medium text-primary mb-2">Regular Updates</h4>
              <p className="text-sm text-muted-foreground">
                Update prices regularly based on wholesale rates and market conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Prices;
