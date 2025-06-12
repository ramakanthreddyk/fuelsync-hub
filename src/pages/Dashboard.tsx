
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Station, Plan, Pump, Sale } from '@/types/database';
import { Building2, Fuel, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Load stations
      let stationsQuery = supabase.from('stations').select('*');
      if (user.role !== 'superadmin') {
        if (user.station_id) {
          stationsQuery = stationsQuery.eq('id', user.station_id);
        }
      }
      const { data: stationsData } = await stationsQuery;
      setStations(stationsData || []);

      // Load plans
      const { data: plansData } = await supabase.from('plans').select('*').eq('is_active', true);
      setPlans(plansData || []);

      // Load pumps for user's station(s)
      if (stationsData && stationsData.length > 0) {
        const stationIds = stationsData.map(s => s.id);
        const { data: pumpsData } = await supabase
          .from('pumps')
          .select('*')
          .in('station_id', stationIds)
          .eq('is_active', true);
        setPumps(pumpsData || []);

        // Load today's sales
        const today = new Date().toISOString().split('T')[0];
        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .in('station_id', stationIds)
          .gte('created_at', today);
        setTodaySales(salesData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const totalRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalVolume = todaySales.reduce((sum, sale) => sum + (sale.delta_volume_l || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's your fuel station overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stations.length}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'superadmin' ? 'Total stations' : 'Your stations'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pumps</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pumps.length}</div>
            <p className="text-xs text-muted-foreground">
              Operational pumps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {todaySales.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Volume</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVolume.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">
              Fuel dispensed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Stations</CardTitle>
            <CardDescription>
              Fuel stations under your management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stations.map((station) => (
                <div key={station.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{station.name}</p>
                    <p className="text-sm text-muted-foreground">{station.address}</p>
                  </div>
                  <Badge variant="outline">{station.brand}</Badge>
                </div>
              ))}
              {stations.length === 0 && (
                <p className="text-muted-foreground">No stations assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Subscription plans for enhanced features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.max_pumps} pumps, {plan.max_ocr_monthly} OCR/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{plan.price_monthly || 0}/month</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
