
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Station, User, Plan } from '@/types/database';
import { Plus, Edit, Building2 } from 'lucide-react';

export default function AdminStations() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    brand: 'IOCL' as const,
    address: '',
    owner_id: null as number | null,
    current_plan_id: null as number | null
  });

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stations with owner info
      const { data: stationsData } = await supabase
        .from('stations')
        .select(`
          *,
          owner:owner_id(name, email),
          plan:current_plan_id(name)
        `)
        .order('created_at', { ascending: false });
      
      // Load users (potential owners)
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .in('role', ['owner', 'superadmin'])
        .order('name');
      
      // Load plans
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setStations(stationsData || []);
      setUsers(usersData || []);
      setPlans(plansData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stations data',
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
          owner_id: newStation.owner_id,
          current_plan_id: newStation.current_plan_id
        }])
        .select()
        .single();

      if (error) throw error;

      // If owner is assigned, update their station_id
      if (newStation.owner_id) {
        await supabase
          .from('users')
          .update({ station_id: data.id })
          .eq('id', newStation.owner_id);
      }

      toast({
        title: 'Success',
        description: 'Station created successfully'
      });

      setIsCreateDialogOpen(false);
      setNewStation({
        name: '',
        brand: 'IOCL',
        address: '',
        owner_id: null,
        current_plan_id: null
      });
      
      loadData();
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

  if (currentUser?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Only superadmins can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Station Management</h1>
          <p className="text-muted-foreground">
            Manage fuel stations and their configurations
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Station
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Station</DialogTitle>
              <DialogDescription>
                Add a new fuel station to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Station Name</Label>
                <Input
                  id="name"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  placeholder="Station name"
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
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
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newStation.address}
                  onChange={(e) => setNewStation({ ...newStation, address: e.target.value })}
                  placeholder="Station address"
                />
              </div>
              <div>
                <Label htmlFor="owner">Station Owner</Label>
                <Select value={newStation.owner_id?.toString() || ''} onValueChange={(value) => setNewStation({ ...newStation, owner_id: value ? parseInt(value) : null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plan">Initial Plan</Label>
                <Select value={newStation.current_plan_id?.toString() || ''} onValueChange={(value) => setNewStation({ ...newStation, current_plan_id: value ? parseInt(value) : null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - ₹{plan.price_monthly || 0}/month
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IOCL Stations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stations.filter(s => s.brand === 'IOCL').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Plans</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Stations</CardTitle>
          <CardDescription>
            Manage and monitor all fuel stations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{station.brand}</Badge>
                  </TableCell>
                  <TableCell>{station.address || 'No address'}</TableCell>
                  <TableCell>
                    {users.find(u => u.id === station.owner_id)?.name || 'No owner'}
                  </TableCell>
                  <TableCell>
                    {plans.find(p => p.id === station.current_plan_id)?.name || 'No plan'}
                  </TableCell>
                  <TableCell>{new Date(station.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
