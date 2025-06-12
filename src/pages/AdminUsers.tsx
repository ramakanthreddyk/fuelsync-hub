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
import { User, Station, Plan } from '@/types/database';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'employee' as 'employee' | 'owner',
    station_id: null as number | null,
    create_first_station: false,
    station_name: '',
    station_brand: 'IOCL' as const,
    station_address: '',
    plan_id: null as number | null
  });

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Load stations
      const { data: stationsData } = await supabase
        .from('stations')
        .select('*')
        .order('name');
      
      // Load plans
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly');
      
      setUsers(usersData || []);
      setStations(stationsData || []);
      setPlans((plansData || []) as Plan[]); // Type assertion to handle Json type
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);
      
      if (newUser.role === 'owner' && newUser.create_first_station) {
        // Create owner with first station
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            password: newUser.password,
            role: newUser.role,
            is_active: true
          }])
          .select()
          .single();

        if (userError) throw userError;

        // Create first station for the owner
        const { data: stationData, error: stationError } = await supabase
          .from('stations')
          .insert([{
            name: newUser.station_name,
            brand: newUser.station_brand,
            address: newUser.station_address,
            owner_id: userData.id,
            current_plan_id: newUser.plan_id
          }])
          .select()
          .single();

        if (stationError) throw stationError;

        toast({
          title: 'Success',
          description: 'Owner and station created successfully'
        });
      } else {
        // Create regular user (employee or owner without station)
        const { data, error } = await supabase
          .from('users')
          .insert([{
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            password: newUser.password,
            role: newUser.role,
            station_id: newUser.role === 'employee' ? newUser.station_id : null,
            is_active: true
          }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'User created successfully'
        });
      }

      setIsCreateDialogOpen(false);
      resetNewUser();
      loadData();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetNewUser = () => {
    setNewUser({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'employee',
      station_id: null,
      create_first_station: false,
      station_name: '',
      station_brand: 'IOCL',
      station_address: '',
      plan_id: null
    });
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      
      loadData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive'
      });
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

  const owners = users.filter(u => u.role === 'owner');
  const employees = users.filter(u => u.role === 'employee');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users, owners, and employees
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      placeholder="+91-9999999999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Password"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value: 'employee' | 'owner') => setNewUser({ ...newUser, role: value, create_first_station: false })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newUser.role === 'owner' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="create_first_station"
                        checked={newUser.create_first_station}
                        onChange={(e) => setNewUser({ ...newUser, create_first_station: e.target.checked })}
                      />
                      <Label htmlFor="create_first_station">Create first station for this owner</Label>
                    </div>
                    
                    {newUser.create_first_station && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="station_name">Station Name</Label>
                            <Input
                              id="station_name"
                              value={newUser.station_name}
                              onChange={(e) => setNewUser({ ...newUser, station_name: e.target.value })}
                              placeholder="Station name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="station_brand">Brand</Label>
                            <Select value={newUser.station_brand} onValueChange={(value: any) => setNewUser({ ...newUser, station_brand: value })}>
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
                        </div>
                        <div>
                          <Label htmlFor="station_address">Address</Label>
                          <Input
                            id="station_address"
                            value={newUser.station_address}
                            onChange={(e) => setNewUser({ ...newUser, station_address: e.target.value })}
                            placeholder="Station address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="plan">Plan</Label>
                          <Select value={newUser.plan_id?.toString() || ''} onValueChange={(value) => setNewUser({ ...newUser, plan_id: value ? parseInt(value) : null })}>
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
                      </div>
                    )}
                  </div>
                )}

                {newUser.role === 'employee' && (
                  <div>
                    <Label htmlFor="station">Station</Label>
                    <Select value={newUser.station_id?.toString() || ''} onValueChange={(value) => setNewUser({ ...newUser, station_id: value ? parseInt(value) : null })}>
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
                )}

                <Button onClick={createUser} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{owners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            All users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const userStations = user.stations || [];
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === 'owner' ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{userStations.length} stations</span>
                        </div>
                      ) : (
                        userStations[0]?.name || 'No station'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.is_active || false)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
