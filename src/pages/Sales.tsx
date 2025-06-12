
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { Sale, DailySummary } from '@/types/api';
import MetricCard from '@/components/MetricCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/hooks/useAuth';

export default function Sales() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { user } = useAuth();

  const currentStation = user?.stations?.[0];

  console.log('📊 Sales page rendering for date:', selectedDate);

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', currentStation?.id],
    queryFn: async () => {
      if (!currentStation) return { data: [] };
      return await apiService.getSales(currentStation.id);
    },
    enabled: !!currentStation
  });

  const { data: dailySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['daily-summary', currentStation?.id],
    queryFn: async () => {
      if (!currentStation) return null;
      return await apiService.getDailySummary(currentStation.id);
    },
    enabled: !!currentStation
  });

  // Handle both array and object responses from API
  const sales = Array.isArray(salesData) ? salesData : (salesData?.data || []);

  // Create fuel type breakdown with proper type handling
  const fuelTypeData = sales.length > 0 ? [
    { 
      name: 'Petrol', 
      value: sales.filter((s: Sale) => s.fuelType === 'Petrol').reduce((sum, s) => sum + s.totalAmount, 0),
      litres: sales.filter((s: Sale) => s.fuelType === 'Petrol').reduce((sum, s) => sum + s.litres, 0),
      transactions: sales.filter((s: Sale) => s.fuelType === 'Petrol').length
    },
    { 
      name: 'Diesel', 
      value: sales.filter((s: Sale) => s.fuelType === 'Diesel').reduce((sum, s) => sum + s.totalAmount, 0),
      litres: sales.filter((s: Sale) => s.fuelType === 'Diesel').reduce((sum, s) => sum + s.litres, 0),
      transactions: sales.filter((s: Sale) => s.fuelType === 'Diesel').length
    }
  ] : [];

  // Generate hourly data from sales transactions
  const hourlyData = React.useMemo(() => {
    if (!sales || sales.length === 0) {
      return [];
    }

    const hourlyMap: Record<string, { hour: string; sales: number; transactions: number }> = {};
    
    sales.forEach((sale) => {
      const hour = new Date(sale.timestamp).getHours();
      const hourRange = `${hour}:00-${hour + 1}:00`;
      
      if (!hourlyMap[hourRange]) {
        hourlyMap[hourRange] = { hour: hourRange, sales: 0, transactions: 0 };
      }
      
      hourlyMap[hourRange].sales += parseFloat(sale.totalAmount.toString());
      hourlyMap[hourRange].transactions += 1;
    });

    return Object.values(hourlyMap).sort((a, b) => {
      const aHour = parseInt(a.hour.split(':')[0]);
      const bHour = parseInt(b.hour.split(':')[0]);
      return aHour - bHour;
    });
  }, [sales]);

  const COLORS = ['#ff6b35', '#1e3a8a'];

  if (salesLoading || summaryLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <span className="text-4xl">⏳</span>
          <p className="text-muted-foreground mt-2">Loading sales data...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = sales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0);
  const totalLitres = sales.reduce((sum: number, sale: Sale) => sum + sale.litres, 0);
  const totalTransactions = sales.length;
  const petrolData = fuelTypeData[0] || { litres: 0, value: 0 };
  const dieselData = fuelTypeData[1] || { litres: 0, value: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your fuel sales, revenue, and performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          subtitle={`${totalLitres}L sold`}
          icon="💰"
          trend={{ value: 12.5, label: 'vs yesterday', direction: 'up' }}
          gradient
        />
        
        <MetricCard
          title="Transactions"
          value={totalTransactions}
          subtitle="completed today"
          icon="🧾"
          trend={{ value: 8.3, label: 'vs yesterday', direction: 'up' }}
        />
        
        <MetricCard
          title="Petrol Sales"
          value={`${petrolData.litres}L`}
          subtitle={`₹${petrolData.value.toLocaleString()}`}
          icon="⛽"
        />
        
        <MetricCard
          title="Diesel Sales"
          value={`${dieselData.litres}L`}
          subtitle={`₹${dieselData.value.toLocaleString()}`}
          icon="🚛"
        />
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fuel Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Fuel Type Distribution</CardTitle>
                <CardDescription>Revenue breakdown by fuel type</CardDescription>
              </CardHeader>
              <CardContent>
                {fuelTypeData.length > 0 && fuelTypeData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={fuelTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, litres }) => `${name}: ₹${value.toLocaleString()} (${litres}L)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {fuelTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl">📊</span>
                    <p className="text-muted-foreground mt-2">No sales data for selected date</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hourly Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Sales Pattern</CardTitle>
                <CardDescription>Sales distribution throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                {hourlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']} />
                      <Bar dataKey="sales" fill="#ff6b35" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl">📈</span>
                    <p className="text-muted-foreground mt-2">No hourly data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trends</CardTitle>
              <CardDescription>7-day sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <span className="text-4xl">📈</span>
                <p className="text-muted-foreground mt-2">Trends chart coming soon</p>
                <p className="text-sm text-muted-foreground">Historical data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest fuel sales transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sales && sales.length > 0 ? (
                  sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sale.fuelType === 'Petrol' ? '⛽' : '🚛'}</span>
                        <div>
                          <p className="font-medium">{sale.fuelType} - {sale.pumpId}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.timestamp).toLocaleString()}
                          </p>
                          {sale.nozzleId && (
                            <p className="text-xs text-muted-foreground">
                              Nozzle {sale.nozzleId}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">₹{sale.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{sale.litres}L @ ₹{sale.pricePerLitre}/L</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl">📊</span>
                    <p className="text-muted-foreground mt-2">No transactions yet</p>
                    <p className="text-sm text-muted-foreground">Upload receipts to see sales data</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
