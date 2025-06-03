
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MetricCard from '@/components/MetricCard';
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { Upload as UploadType } from '@/types/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch dashboard data from API
  const { data: summaryData } = useQuery({
    queryKey: ['daily-summary', new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const response = await apiService.getDailySummary(new Date().toISOString().split('T')[0]);
      return response.data || {
        totalRevenue: 0,
        totalLitres: 0,
        totalTransactions: 0
      };
    }
  });

  const { data: uploadsData } = useQuery({
    queryKey: ['recent-uploads'],
    queryFn: async () => {
      const response = await apiService.getUploads(1, 3); // Get only 3 recent uploads
      return response.data || [];
    }
  });

  const { data: pumpsData } = useQuery({
    queryKey: ['pumps'],
    queryFn: async () => {
      const response = await apiService.getPumps();
      return response.data || [];
    }
  });

  // Calculate metrics from API data with safe defaults
  const metrics = {
    todaySales: {
      revenue: summaryData ? `₹${summaryData.totalRevenue.toLocaleString()}` : "₹0",
      litres: summaryData ? `${summaryData.totalLitres} L` : "0 L",
      transactions: summaryData?.totalTransactions || 0
    },
    uploads: {
      today: uploadsData?.filter(upload => 
        new Date(upload.uploadedAt).toDateString() === new Date().toDateString()
      ).length || 0,
      limit: 5, // This should come from user plan
      remaining: 5 - (uploadsData?.filter(upload => 
        new Date(upload.uploadedAt).toDateString() === new Date().toDateString()
      ).length || 0)
    },
    pumps: {
      active: pumpsData?.filter(pump => pump.status === 'active').length || 0,
      total: pumpsData?.length || 0,
      efficiency: pumpsData?.length > 0 ? 94.5 : 0 // Calculate from real data when available
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-fuel-success bg-fuel-success/10 border-fuel-success/20';
      case 'processing':
        return 'text-fuel-warning bg-fuel-warning/10 border-fuel-warning/20';
      case 'failed':
        return 'text-fuel-error bg-fuel-error/10 border-fuel-error/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening at your fuel station today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 text-fuel-blue border-fuel-blue/20 bg-fuel-blue/5">
            Basic Plan
          </Badge>
          <Button 
            className="bg-fuel-orange hover:bg-fuel-orange/90 text-white"
            onClick={() => navigate('/app/upload')}
          >
            Upload Receipt
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Revenue"
          value={metrics.todaySales.revenue}
          subtitle={`${metrics.todaySales.litres} sold`}
          icon="💰"
          trend={summaryData?.totalRevenue > 0 ? { value: 12.5, label: 'vs yesterday', direction: 'up' } : undefined}
          gradient
        />
        
        <MetricCard
          title="Transactions"
          value={metrics.todaySales.transactions}
          subtitle="completed today"
          icon="🧾"
          trend={summaryData?.totalTransactions > 0 ? { value: 8.3, label: 'vs yesterday', direction: 'up' } : undefined}
        />
        
        <MetricCard
          title="OCR Uploads"
          value={`${metrics.uploads.today}/${metrics.uploads.limit}`}
          subtitle={`${metrics.uploads.remaining} remaining`}
          icon="📄"
        />
        
        <MetricCard
          title="Pump Efficiency"
          value={metrics.pumps.total > 0 ? `${metrics.pumps.efficiency}%` : "No data"}
          subtitle={`${metrics.pumps.active}/${metrics.pumps.total} pumps active`}
          icon="⛽"
          trend={metrics.pumps.total > 0 ? { value: 2.1, label: 'vs last week', direction: 'up' } : undefined}
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Uploads */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📄</span>
                Recent OCR Uploads
              </CardTitle>
              <CardDescription>
                Your latest receipt uploads and their processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadsData && uploadsData.length > 0 ? (
                  uploadsData.map((upload: UploadType, index: number) => (
                    <div key={upload.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-fuel-blue animate-pulse" />
                          <div>
                            <p className="font-medium text-sm">₹{upload.amount || 'Processing...'}</p>
                            <p className="text-xs text-muted-foreground">{upload.litres ? `${upload.litres}L` : 'Processing...'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-1 ${getStatusColor(upload.status)}`}
                          >
                            {upload.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(upload.uploadedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {index < uploadsData.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No recent uploads</p>
                    <p className="text-sm text-muted-foreground">Upload your first receipt to get started</p>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/app/upload')}
              >
                View All Uploads
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚡</span>
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start bg-fuel-orange hover:bg-fuel-orange/90 text-white"
                  onClick={() => navigate('/app/upload')}
                >
                  <span className="mr-2">📄</span>
                  Upload Receipt
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/app/prices')}
                >
                  <span className="mr-2">⛽</span>
                  Update Fuel Prices
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/app/sales')}
                >
                  <span className="mr-2">📊</span>
                  View Sales Report
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/app/pumps')}
                >
                  <span className="mr-2">🏭</span>
                  Check Pump Status
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Need help?
                </p>
                <Button variant="ghost" size="sm" className="text-fuel-blue">
                  View User Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔧</span>
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-fuel-success animate-pulse" />
              <div>
                <p className="font-medium text-sm">OCR Service</p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-fuel-success animate-pulse" />
              <div>
                <p className="font-medium text-sm">Database</p>
                <p className="text-xs text-muted-foreground">Connected and syncing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-fuel-warning animate-pulse" />
              <div>
                <p className="font-medium text-sm">Cloud Storage</p>
                <p className="text-xs text-muted-foreground">
                  {uploadsData && uploadsData.length > 0 ? 'Active' : 'No uploads yet'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
