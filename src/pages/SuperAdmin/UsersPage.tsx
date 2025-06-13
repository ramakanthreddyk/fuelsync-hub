
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Users, Mail, Phone } from 'lucide-react';

export function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [stationFilter, setStationFilter] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['superadmin-users', roleFilter, stationFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (stationFilter) params.set('stationId', stationFilter);
      
      return apiClient.superadminRequest(`superadmin-users?${params.toString()}`);
    },
  });

  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
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
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-800';
      case 'owner': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users across all stations</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All roles</SelectItem>
            <SelectItem value="superadmin">Super Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stationFilter} onValueChange={setStationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by station" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All stations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((user: any) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {user.name || 'Unnamed User'}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role}
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
                    disabled={toggleUserMutation.isPending}
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
                  <div className="text-muted-foreground">Stations:</div>
                  {user.user_stations.map((us: any) => (
                    <div key={us.station_id} className="text-xs">
                      {us.stations?.name}
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
              No users match the current filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
