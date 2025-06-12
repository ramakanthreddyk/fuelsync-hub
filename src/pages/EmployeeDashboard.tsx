
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Station, OCRReading, Sale } from '@/types/database';
import { Building2, Fuel, TrendingUp, Calendar } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [station, setStation] = useState<Station | null>(null);
  const [recentReadings, setRecentReadings] = useState<OCRReading[]>([]);
  const [todaysSales, setTodaysSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'employee' && user?.station_id) {
      loadEmployeeData();
    }
  }, [user]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Load station details
      const { data: stationData } = await supabase
        .from('stations')
        .select('*')
        .eq('id', user?.station_id)
        .single();
      
      // Load recent OCR readings for this station
      const { data: readingsData } = await supabase
        .from('ocr_readings')
        .select('*')
        .eq('station_id', user?.station_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Load today's sales for this station
      const today = new Date().toISOString().split('T')[0];
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .eq('station_id', user?.station_id)
        .gte('created_at', today + 'T00:00:00')
        .order('created_at', { ascending: false });
      
      setStation(stationData);
      setRecentReadings(readingsData || []);
      setTodaysSales(salesData || []);
    } catch (error) {
      console.error('Error loading employee data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'employee') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Only employees can access this dashboard</p>
        </div>
      </div>
    );
  }

  const totalSalesToday = todaysSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalLitresToday = todaysSales.reduce((sum, sale) => sum + (sale.delta_volume_l || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>
      </div>

      {/* Station Info */}
      {station && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {station.name}
            </CardTitle>
            <CardDescription>
              {station.address} • {station.brand} Station
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSalesToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Sold</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLitresToday.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">
              Total litres today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysSales.length}</div>
            <p className="text-xs text-muted-foreground">
              Sales transactions today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Readings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentReadings.length}</div>
            <p className="text-xs text-muted-foreground">
              OCR readings recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Sales</CardTitle>
          <CardDescription>
            Recent fuel sales transactions at your station
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Volume (L)</TableHead>
                <TableHead>Rate (₹/L)</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaysSales.slice(0, 10).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{sale.delta_volume_l?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>₹{sale.price_per_litre?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="font-medium">₹{sale.total_amount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <Badge variant="default">Completed</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {todaysSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No sales transactions today
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent OCR Readings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent OCR Readings</CardTitle>
          <CardDescription>
            Latest pump readings and data entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Cumulative Volume</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReadings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell>{reading.reading_date}</TableCell>
                  <TableCell>{reading.reading_time}</TableCell>
                  <TableCell>
                    <Badge variant={reading.source === 'ocr' ? 'default' : 'secondary'}>
                      {reading.source.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{reading.cumulative_vol.toFixed(2)}L</TableCell>
                  <TableCell>
                    <Badge variant="default">Processed</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {recentReadings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No recent readings available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
