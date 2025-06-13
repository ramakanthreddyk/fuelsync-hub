
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Users, Mail, Phone, AlertCircle, Crown, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['owner', 'employee']),
  station_id: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

export function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'employee',
      station_id: '',
    },
  });

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['superadmin-users', roleFilter, stationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);
      if (stationFilter && stationFilter !== 'all') params.set('stationId', stationFilter);
      
      console.log('Fetching users with params:', params.toString());
      return apiClient.superadminRequest(`superadmin-users?${params.toString()}`);
    },
  });

  const { data: stations } = useQuery({
    queryKey: ['superadmin-stations'],
    queryFn: async () => {
      return apiClient.superadminRequest('superadmin-stations');
    },
  });

  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      console.log('Toggling user:', userId, 'to active:', isActive);
      return apiClient.superadminRequest(`superadmin-actions/users/${userId}/activate`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      toast({ title: "Success", description: "User status updated" });
    },
    onError: (error: any) => {
      console.error('Toggle user error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update user status", 
        variant: "destructive" 
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      return apiClient.superadminRequest('superadmin-users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      toast({ title: "Success", description: "User created successfully" });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Create user error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create user", 
        variant: "destructive" 
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: Partial<UserFormData> }) => {
      return apiClient.superadminRequest(`superadmin-actions/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      toast({ title: "Success", description: "User updated successfully" });
      setEditingUser(null);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Update user error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update user", 
        variant: "destructive" 
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.superadminRequest(`superadmin-actions/users/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete user", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({ userId: editingUser.id, userData: data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.reset({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      station_id: user.user_stations?.[0]?.station_id?.toString() || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'owner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading platform users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Error loading users: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="w-8 h-8 text-amber-500" />
            Platform User Management
          </h1>
          <p className="text-muted-foreground">Manage all users across the FuelSync platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingUser(null);
                form.reset();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user information' : 'Add a new user to the platform'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter user name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="owner">Station Owner</SelectItem>
                            <SelectItem value="employee">Station Employee</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {stations && stations.length > 0 && (
                    <FormField
                      control={form.control}
                      name="station_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Station (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select station" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No station</SelectItem>
                              {stations.map((station: any) => (
                                <SelectItem key={station.id} value={station.id.toString()}>
                                  {station.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                      {editingUser ? 'Update User' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="superadmin">Super Admin</SelectItem>
            <SelectItem value="owner">Station Owner</SelectItem>
            <SelectItem value="employee">Station Employee</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stationFilter} onValueChange={setStationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by station" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stations</SelectItem>
            {stations?.map((station: any) => (
              <SelectItem key={station.id} value={station.id.toString()}>
                {station.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((user: any) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {user.name || 'Unnamed User'}
                {user.role === 'superadmin' && <Crown className="w-4 h-4 text-amber-500" />}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getRoleBadgeColor(user.role)} variant="outline">
                  {user.role === 'superadmin' ? 'Platform Admin' : 
                   user.role === 'owner' ? 'Station Owner' : 
                   'Station Employee'}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch
                    checked={user.is_active}
                    onCheckedChange={(checked) => 
                      toggleUserMutation.mutate({ 
                        userId: user.id, 
                        isActive: checked 
                      })
                    }
                    disabled={toggleUserMutation.isPending || user.role === 'superadmin'}
                  />
                </div>
              </div>

              {user.phone && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {user.phone}
                </div>
              )}

              {user.user_stations?.length > 0 && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Assigned Stations:</div>
                  {user.user_stations.map((us: any) => (
                    <div key={us.station_id} className="text-xs bg-muted rounded px-2 py-1 mt-1">
                      {us.stations?.name || `Station ${us.station_id}`}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(user)}
                  disabled={user.role === 'superadmin'}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                  disabled={user.role === 'superadmin'}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!users || users.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-muted-foreground">
              No platform users match the current filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
