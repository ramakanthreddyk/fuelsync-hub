import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Users, Settings, Trash2, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface UserWithStations {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'superadmin' | 'owner' | 'employee';
  is_active: boolean;
  created_at: string;
  stations?: Array<{ id: number; name: string; brand: string; address: string }>;
}

interface Station {
  id: number;
  name: string;
  brand: string;
  address: string;
}

export default function AdminUsers() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee' as const,
    station_id: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Only superadmin can access this page
  if (user?.role !== 'superadmin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Access denied. This page is only available to super administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch users - for employees get their station, for owners get their owned stations
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          stations!users_station_id_fkey (id, name, brand, address)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserWithStations[];
    },
  });

  // Fetch stations for dropdown
  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Station[];
    },
  });

  // Modified Add User Mutation: Now sends invitation, no direct insert
  const inviteUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      // Call Supabase Auth to invite the user
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(userData.email, {
        data: { name: userData.name, phone: userData.phone, role: userData.role }
      });
      if (error) throw error;
      // Record meta (optional, record will be linked after user registers)
      return data;
    },
    onSuccess: () => {
      setIsAddUserOpen(false);
      setNewUser({ name: '', email: '', phone: '', role: 'employee', station_id: '' });
      toast({ title: "Invitation sent", description: "User invited. They must finish signup via email for their account to activate." });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Inviting User",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and email",
        variant: "destructive",
      });
      return;
    }
    inviteUserMutation.mutate(newUser);
  };

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'owner': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Shield className="w-4 h-4" />;
      case 'owner': return <Settings className="w-4 h-4" />;
      case 'employee': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Invite new users by email. They must complete registration using the invite to access the system.<br />
            Once registered, you can assign them to a station and set their role below.
          </p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Sends a registration link to their email; once registered, set their permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91-9876543210"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value, station_id: '' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'employee' && (
                <div>
                  <Label htmlFor="station">Assign to Station</Label>
                  <Select value={newUser.station_id} onValueChange={(value) => setNewUser(prev => ({ ...prev, station_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a station" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations?.map((station) => (
                        <SelectItem key={station.id} value={station.id.toString()}>
                          {station.name} ({station.brand})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleAddUser} disabled={inviteUserMutation.isPending} className="w-full">
                {inviteUserMutation.isPending ? 'Inviting...' : 'Send Invite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((userItem) => (
          <Card key={userItem.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getRoleIcon(userItem.role)}
                    {userItem.name}
                  </CardTitle>
                  <CardDescription>{userItem.email}</CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getRoleColor(userItem.role)}>
                    {userItem.role}
                  </Badge>
                  <Badge variant={userItem.is_active ? "default" : "secondary"}>
                    {userItem.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <div className="text-muted-foreground">Phone:</div>
                <div>{userItem.phone || 'Not provided'}</div>
              </div>
              
              {userItem.stations && userItem.stations.length > 0 && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Station:</div>
                  <div>{userItem.stations[0]?.name || 'Unknown Station'}</div>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Created: {new Date(userItem.created_at).toLocaleDateString()}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={userItem.is_active ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleToggleStatus(userItem.id, userItem.is_active)}
                  disabled={toggleUserStatusMutation.isPending}
                >
                  {userItem.is_active ? 'Deactivate' : 'Activate'}
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
            <p className="text-muted-foreground mb-4">
              Get started by creating user accounts for your system.
            </p>
            <Button onClick={() => setIsAddUserOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First User
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
