import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Station, Plan } from '@/types/database';
import { Plus, Building2, Users, BarChart3, TrendingUp } from 'lucide-react';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    brand: 'IOCL' as const,
    address: '',
    plan_id: null as number | null
  });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    station_id: null as number | null
  });

  useEffect(() => {
    if (user?.role === 'owner') {
      loadOwnerData();
    }
  }, [user]);

  const loadOwnerData = async () => {
    try {
      setLoading(true);
      
      // Load owner's stations
      const { data: stationsData } = await supabase
        .from('stations')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });
      
      // Load employees for owner's stations
      const stationIds = stationsData?.map(s => s.id) || [];
      const { data: employeesData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee')
        .in('station_id', stationIds);
      
      // Load plans
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly');
      
      setStations(stationsData || []);
      setEmployees(employeesData || []);
      setPlans((plansData || []) as Plan[]); // Type assertion to handle Json type
    } catch (error) {
      console.error('Error loading owner data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createStation = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('stations')
        .insert([{
          name: newStation.name,
          brand: newStation.brand,
          address: newStation.address,
          owner_id: user?.id,
          current_plan_id: newStation.plan_id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Station created successfully'
      });

      setIsAddStationOpen(false);
      setNewStation({ name: '', brand: 'IOCL', address: '', plan_id: null });
      loadOwnerData();
    } catch (error) {
      console.error('Error creating station:', error);
      toast({
        title: 'Error',
        description: 'Failed to create station',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: newEmployee.name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          password: newEmployee.password,
          role: 'employee',
          station_id: newEmployee.station_id,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Employee created successfully'
      });

      setIsAddEmployeeOpen(false);
      setNewEmployee({ name: '', email: '', phone: '', password: '', station_id: null });
      loadOwnerData();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to create employee',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Only owners can access this dashboard</p>
        </div>
      </div>
    );
  }

  const totalEmployees = employees.length;
  const totalStations = stations.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStations}</div>
            <p className="text-xs text-muted-foreground">
              Across different locations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Working across all stations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹2,45,000</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Sold</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,420L</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stations Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Stations</CardTitle>
              <CardDescription>
                Manage your fuel stations and their operations
              </CardDescription>
            </div>
            <Dialog open={isAddStationOpen} onOpenChange={setIsAddStationOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Station
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Station</DialogTitle>
                  <DialogDescription>
                    Create a new fuel station under your ownership
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="station-name">Station Name</Label>
                    <Input
                      id="station-name"
                      value={newStation.name}
                      onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                      placeholder="Enter station name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="station-brand">Brand</Label>
                    <Select value={newStation.brand} onValueChange={(value: any) => setNewStation({ ...newStation, brand: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IOCL">IOCL</SelectItem>
                        <SelectItem value="BPCL">BPCL</SelectItem>
                        <SelectItem value="HPCL">HPCL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="station-address">Address</Label>
                    <Input
                      id="station-address"
                      value={newStation.address}
                      onChange={(e) => setNewStation({ ...newStation, address: e.target.value })}
                      placeholder="Enter station address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="station-plan">Plan</Label>
                    <Select value={newStation.plan_id?.toString() || ''} onValueChange={(value) => setNewStation({ ...newStation, plan_id: value ? parseInt(value) : null })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name} - ₹{plan.price_monthly}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createStation} disabled={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Station'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((station) => {
                const stationEmployees = employees.filter(emp => emp.station_id === station.id);
                return (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{station.brand}</Badge>
                    </TableCell>
                    <TableCell>{station.address}</TableCell>
                    <TableCell>{stationEmployees.length} employees</TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell>{new Date(station.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employees Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employees</CardTitle>
              <CardDescription>
                Manage employees across all your stations
              </CardDescription>
            </div>
            <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Create a new employee account for one of your stations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="emp-name">Name</Label>
                    <Input
                      id="emp-name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-email">Email</Label>
                    <Input
                      id="emp-email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-phone">Phone</Label>
                    <Input
                      id="emp-phone"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      placeholder="+91-9999999999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-password">Password</Label>
                    <Input
                      id="emp-password"
                      type="password"
                      value={newEmployee.password}
                      onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                      placeholder="Password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-station">Station</Label>
                    <Select value={newEmployee.station_id?.toString() || ''} onValueChange={(value) => setNewEmployee({ ...newEmployee, station_id: value ? parseInt(value) : null })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select station" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((station) => (
                          <SelectItem key={station.id} value={station.id.toString()}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createEmployee} disabled={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Employee'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const station = stations.find(s => s.id === employee.station_id);
                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{station?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(employee.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
