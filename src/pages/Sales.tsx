
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

const Sales = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await apiService.getSales();
      return response.data || [];
    }
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['daily-summary', selectedDate],
    queryFn: async () => {
      const response = await apiService.getDailySummary(selectedDate);
      return response.data;
    }
  });

  // Chart data
  const fuelTypeData = summaryData ? [
    { name: 'Petrol', value: summaryData.fuelTypeBreakdown.petrol.revenue, litres: summaryData.fuelTypeBreakdown.petrol.litres },
    { name: 'Diesel', value: summaryData.fuelTypeBreakdown.diesel.revenue, litres: summaryData.fuelTypeBreakdown.diesel.litres }
  ] : [];

  const hourlyData = [
    { hour: '6-8', sales: 12500 },
    { hour: '8-10', sales: 18700 },
    { hour: '10-12', sales: 15600 },
    { hour: '12-14', sales: 22300 },
    { hour: '14-16', sales: 19800 },
    { hour: '16-18', sales: 25400 },
    { hour: '18-20', sales: 21200 }
  ];

  const COLORS = ['#ff6b35', '#1e3a8a'];

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
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Today's Revenue"
            value={`₹${summaryData.totalRevenue.toLocaleString()}`}
            subtitle={`${summaryData.totalLitres}L sold`}
            icon="💰"
            trend={{ value: 12.5, label: 'vs yesterday', direction: 'up' }}
            gradient
          />
          
          <MetricCard
            title="Transactions"
            value={summaryData.totalTransactions}
            subtitle="completed today"
            icon="🧾"
            trend={{ value: 8.3, label: 'vs yesterday', direction: 'up' }}
          />
          
          <MetricCard
            title="Petrol Sales"
            value={`${summaryData.fuelTypeBreakdown.petrol.litres}L`}
            subtitle={`₹${summaryData.fuelTypeBreakdown.petrol.revenue.toLocaleString()}`}
            icon="⛽"
          />
          
          <MetricCard
            title="Diesel Sales"
            value={`${summaryData.fuelTypeBreakdown.diesel.litres}L`}
            subtitle={`₹${summaryData.fuelTypeBreakdown.diesel.revenue.toLocaleString()}`}
            icon="🚛"
          />
        </div>
      )}

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
              </CardContent>
            </Card>

            {/* Hourly Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Sales Pattern</CardTitle>
                <CardDescription>Sales distribution throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']} />
                    <Bar dataKey="sales" fill="#ff6b35" />
                  </BarChart>
                </ResponsiveContainer>
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
              {salesLoading ? (
                <div className="text-center py-8">
                  <span className="text-2xl">⏳</span>
                  <p className="text-muted-foreground mt-2">Loading transactions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {salesData?.map((sale: Sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sale.fuelType === 'Petrol' ? '⛽' : '🚛'}</span>
                        <div>
                          <p className="font-medium">{sale.fuelType} - {sale.pumpId}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">₹{sale.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{sale.litres}L @ ₹{sale.pricePerLitre}/L</p>
                      </div>
                    </div>
                  ))}
                  
                  {!salesData?.length && (
                    <div className="text-center py-8">
                      <span className="text-4xl">📊</span>
                      <p className="text-muted-foreground mt-2">No transactions yet</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sales;
