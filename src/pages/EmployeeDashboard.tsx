
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { fuelPriceService } from '@/services/fuelPriceService';
import { tenderService } from '@/services/tenderService';
import { Badge } from '@/components/ui/badge';
import { Fuel, DollarSign, Clock, Users } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [todaysTenders, setTodaysTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get the first station for this employee
  const currentStation = user?.stations?.[0];

  useEffect(() => {
    const fetchData = async () => {
      if (!currentStation) return;
      
      try {
        const [pricesData, tendersData] = await Promise.all([
          fuelPriceService.getFuelPrices(currentStation.id),
          tenderService.getTenderEntries(currentStation.id, new Date().toISOString().split('T')[0])
        ]);

        setFuelPrices(pricesData);
        setTodaysTenders(tendersData.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentStation]);

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
              No station assigned to your account. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          <p className="text-sm text-muted-foreground">Station: {currentStation.name}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Fuel Prices</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fuelPrices.slice(0, 4).map((price) => (
                <div key={price.id} className="flex justify-between items-center">
                  <span className="text-sm">{price.fuel_type}</span>
                  <span className="font-medium">₹{price.price_per_litre}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{todaysTenders.reduce((sum, tender) => sum + tender.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaysTenders.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Station Info</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm"><strong>Brand:</strong> {currentStation.brand}</p>
              <p className="text-sm"><strong>Address:</strong> {currentStation.address || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tender Entries</CardTitle>
          <CardDescription>Today's payment collections</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysTenders.length > 0 ? (
            <div className="space-y-3">
              {todaysTenders.slice(0, 10).map((tender) => (
                <div key={tender.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{tender.payer || 'Unknown Customer'}</p>
                    <p className="text-sm text-muted-foreground">
                      {tender.type?.charAt(0).toUpperCase() + tender.type?.slice(1)} • {new Date(tender.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{tender.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No tender entries recorded today
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
