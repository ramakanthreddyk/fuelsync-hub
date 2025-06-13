
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Fuel, TrendingUp, Clock } from "lucide-react";

interface DashboardStats {
  todaySales: number;
  todayTender: number;
  totalReadings: number;
  lastReading: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTender: 0,
    totalReadings: 0,
    lastReading: null
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentStation = user?.stations?.[0];
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (currentStation) {
      loadDashboardStats();
    }
  }, [currentStation]);

  const loadDashboardStats = async () => {
    if (!currentStation) return;

    try {
      // Get today's sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('station_id', currentStation.id)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`);

      const todaySales = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      // Get today's tender
      const { data: tenderData } = await supabase
        .from('tender_entries')
        .select('amount')
        .eq('station_id', currentStation.id)
        .eq('entry_date', today);

      const todayTender = tenderData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

      // Get total readings count
      const { count: readingsCount } = await supabase
        .from('ocr_readings')
        .select('*', { count: 'exact' })
        .eq('station_id', currentStation.id);

      // Get last reading time
      const { data: lastReadingData } = await supabase
        .from('ocr_readings')
        .select('created_at')
        .eq('station_id', currentStation.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setStats({
        todaySales,
        todayTender,
        totalReadings: readingsCount || 0,
        lastReading: lastReadingData?.[0]?.created_at || null
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Calculated from fuel dispensing
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{stats.todayTender.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Cash, card, UPI, and credit
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReadings}</div>
            <p className="text-xs text-muted-foreground">
              OCR and manual entries
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Reading</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {stats.lastReading ? new Date(stats.lastReading).toLocaleTimeString() : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastReading ? new Date(stats.lastReading).toLocaleDateString() : 'No readings yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Daily Variance</CardTitle>
            <CardDescription>
              Difference between sales and collections today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              {Math.abs(stats.todaySales - stats.todayTender) < 0.01 ? (
                <div className="text-green-600">
                  <div className="text-3xl font-bold">Balanced</div>
                  <p className="text-sm mt-2">Sales and collections match</p>
                </div>
              ) : stats.todaySales > stats.todayTender ? (
                <div className="text-red-600">
                  <div className="text-3xl font-bold">-₹{(stats.todaySales - stats.todayTender).toFixed(2)}</div>
                  <p className="text-sm mt-2">Collection shortage</p>
                </div>
              ) : (
                <div className="text-blue-600">
                  <div className="text-3xl font-bold">+₹{(stats.todayTender - stats.todaySales).toFixed(2)}</div>
                  <p className="text-sm mt-2">Collection excess</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for daily operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => window.location.href = '/upload'}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
              >
                <div className="font-medium group-hover:text-primary">Add Reading</div>
                <div className="text-sm text-muted-foreground">Manual entry</div>
              </button>
              <button 
                onClick={() => window.location.href = '/upload'}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
              >
                <div className="font-medium group-hover:text-primary">Record Payment</div>
                <div className="text-sm text-muted-foreground">Tender entry</div>
              </button>
              <button 
                onClick={() => window.location.href = '/daily-closure'}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
              >
                <div className="font-medium group-hover:text-primary">Daily Closure</div>
                <div className="text-sm text-muted-foreground">End of day</div>
              </button>
              <button 
                onClick={() => window.location.href = '/settings'}
                className="p-4 text-left border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 group"
              >
                <div className="font-medium group-hover:text-primary">Settings</div>
                <div className="text-sm text-muted-foreground">Configuration</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
