
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Users, Mail, Phone, AlertCircle, Crown } from 'lucide-react';

export function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['superadmin-users', roleFilter, stationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);
      if (stationFilter && stationFilter !== 'all') params.set('stationId', stationFilter);
      
      console.log('Fetching users with params:', params.toString());
      return apiClient.superadminRequest(`superadmin-users?${params.toString()}`);
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
