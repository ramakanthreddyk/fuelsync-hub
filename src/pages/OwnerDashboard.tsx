import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Building2, UserPlus } from 'lucide-react';

const OwnerDashboard = () => {
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [newPump, setNewPump] = useState({
    pumpSno: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [pumpDialogOpen, setPumpDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const currentStation = user?.stations?.[0];

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      window.location.href = '/';
    }
  }, [user]);

  const handleCreateEmployee = async () => {
    if (!currentStation) return;
    
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
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Link employee to station
      await supabase
        .from('user_stations')
        .insert([{
          user_id: data.id,
          station_id: currentStation.id
        }]);

      toast({
        title: 'Success',
        description: 'Employee created successfully'
      });
      setEmployeeDialogOpen(false);
      setNewEmployee({ name: '', email: '', phone: '', password: '' });
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

  const handleCreatePump = async () => {
    if (!currentStation) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pumps')
        .insert([{
          station_id: currentStation.id,
          pump_sno: newPump.pumpSno,
          name: newPump.name,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Pump created successfully'
      });
      setPumpDialogOpen(false);
      setNewPump({ pumpSno: '', name: '' });
    } catch (error) {
      console.error('Error creating pump:', error);
      toast({
        title: 'Error',
        description: 'Failed to create pump',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentStation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="text-center">
            <CardTitle>No Station Assigned</CardTitle>
            <CardDescription>
              Please contact your administrator to assign a station to your account.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage your station</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Station Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Name: {currentStation.name}</p>
              <p className="text-sm font-medium">Brand: {currentStation.brand}</p>
              <p className="text-sm text-muted-foreground">
                {currentStation.address || 'No address specified'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </CardTitle>
              <Button size="sm" onClick={() => setEmployeeDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage employee accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Add Pump
              </CardTitle>
              <Button size="sm" onClick={() => setPumpDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add and manage fuel pumps
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Dialog */}
      <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${employeeDialogOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Create New Employee
                </h3>
                <div className="mt-2">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                        placeholder="+91-9999999999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newEmployee.password}
                        onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                        placeholder="Password"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button onClick={handleCreateEmployee} disabled={loading} className="ml-3">
                  {loading ? 'Creating...' : 'Create Employee'}
                </Button>
                <Button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setEmployeeDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pump Dialog */}
      <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${pumpDialogOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Create New Pump
                </h3>
                <div className="mt-2">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="pumpSno">Pump SNO</Label>
                      <Input
                        id="pumpSno"
                        value={newPump.pumpSno}
                        onChange={(e) => setNewPump({ ...newPump, pumpSno: e.target.value })}
                        placeholder="Pump SNO"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newPump.name}
                        onChange={(e) => setNewPump({ ...newPump, name: e.target.value })}
                        placeholder="Name"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button onClick={handleCreatePump} disabled={loading} className="ml-3">
                  {loading ? 'Creating...' : 'Create Pump'}
                </Button>
                <Button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setPumpDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
