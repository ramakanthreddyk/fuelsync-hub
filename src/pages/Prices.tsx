
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { fuelPriceService } from '@/services/fuelPriceService';
import { useToast } from '@/hooks/use-toast';
import { Fuel, Edit, History } from 'lucide-react';

const Prices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const currentStation = user?.stations?.[0];

  useEffect(() => {
    const fetchPrices = async () => {
      if (!currentStation) return;
      
      try {
        const prices = await fuelPriceService.getFuelPrices(currentStation.id);
        setFuelPrices(prices);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch fuel prices",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [currentStation, toast]);

  const handleUpdatePrice = async (fuelType: string) => {
    if (!currentStation || !user) return;
    
    try {
      await fuelPriceService.updateFuelPrice(
        currentStation.id,
        fuelType as any,
        parseFloat(newPrice),
        user.id
      );
      
      // Refresh prices
      const updatedPrices = await fuelPriceService.getFuelPrices(currentStation.id);
      setFuelPrices(updatedPrices);
      
      setEditingPrice(null);
      setNewPrice('');
      
      toast({
        title: "Success",
        description: `${fuelType} price updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update fuel price",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentStation) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No station assigned to your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fuelTypes = ['PETROL', 'DIESEL', 'CNG', 'EV'];
  const latestPrices = fuelTypes.map(fuelType => {
    const pricesForType = fuelPrices.filter(p => p.fuel_type === fuelType);
    return pricesForType.sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime())[0];
  }).filter(Boolean);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fuel Prices</h1>
          <p className="text-muted-foreground">Manage fuel prices for {currentStation.name}</p>
        </div>
        <Fuel className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {fuelTypes.map((fuelType) => {
          const currentPrice = latestPrices.find(p => p?.fuel_type === fuelType);
          
          return (
            <Card key={fuelType}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{fuelType}</CardTitle>
                <CardDescription>
                  Current price per litre
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingPrice === fuelType ? (
                  <div className="space-y-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Enter new price"
                      className="text-center"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdatePrice(fuelType)}
                        disabled={!newPrice}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingPrice(null);
                          setNewPrice('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        ₹{currentPrice?.price_per_litre || '0.00'}
                      </div>
                      {currentPrice && (
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(currentPrice.valid_from).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setEditingPrice(fuelType);
                        setNewPrice(currentPrice?.price_per_litre?.toString() || '');
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Price
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Price History
          </CardTitle>
          <CardDescription>Recent fuel price changes</CardDescription>
        </CardHeader>
        <CardContent>
          {fuelPrices.length > 0 ? (
            <div className="space-y-3">
              {fuelPrices
                .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime())
                .slice(0, 10)
                .map((price) => (
                  <div key={price.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{price.fuel_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(price.valid_from).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{price.price_per_litre}</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No price history available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Prices;
