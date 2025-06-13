
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Building2, MapPin, User, AlertCircle, Plus, Edit, RefreshCw, Crown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const stationFormSchema = z.object({
  name: z.string().min(1, 'Station name is required'),
  brand: z.enum(['HP', 'BPCL', 'IOCL', 'SHELL', 'RELIANCE']),
  address: z.string().min(1, 'Address is required'),
  owner_id: z.string().min(1, 'Owner is required'),
  current_plan_id: z.string().optional(),
});

type StationFormData = z.infer<typeof stationFormSchema>;

export function StationsPage() {
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StationFormData>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: {
      name: '',
      brand: 'HP',
      address: '',
      owner_id: '',
      current_plan_id: '',
    },
  });

  const { data: stations, isLoading, error, refetch } = useQuery({
    queryKey: ['superadmin-stations', brandFilter, ownerFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (brandFilter && brandFilter !== 'all') params.set('brand', brandFilter);
      if (ownerFilter && ownerFilter !== 'all') params.set('ownerId', ownerFilter);
      
      return apiClient.superadminRequest(`superadmin-stations?${params.toString()}`);
    },
  });

  const { data: owners } = useQuery({
    queryKey: ['superadmin-owners'],
    queryFn: async () => {
      return apiClient.superadminRequest('superadmin-users?role=owner');
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['superadmin-plans'],
    queryFn: async () => {
      return apiClient.superadminRequest('superadmin-plans');
    },
  });

  const createStationMutation = useMutation({
    mutationFn: async (stationData: StationFormData) => {
      return apiClient.superadminRequest('superadmin-stations', {
        method: 'POST',
        body: JSON.stringify(stationData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-stations'] });
      toast({ title: "Success", description: "Station created successfully" });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Create station error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create station", 
        variant: "destructive" 
      });
    },
  });

  const updateStationMutation = useMutation({
    mutationFn: async ({ stationId, stationData }: { stationId: number; stationData: Partial<StationFormData> }) => {
      return apiClient.superadminRequest(`superadmin-actions/stations/${stationId}`, {
        method: 'PUT',
        body: JSON.stringify(stationData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-stations'] });
      toast({ title: "Success", description: "Station updated successfully" });
      setEditingStation(null);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Update station error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update station", 
        variant: "destructive" 
      });
    },
  });

  const toggleStationMutation = useMutation({
    mutationFn: async ({ stationId, isActive }: { stationId: number; isActive: boolean }) => {
      return apiClient.superadminRequest(`superadmin-actions/stations/${stationId}/deactivate`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-stations'] });
      toast({ title: "Success", description: "Station status updated" });
    },
    onError: (error: any) => {
      console.error('Toggle station error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update station status", 
        variant: "destructive" 
      });
    },
  });

  const assignPlanMutation = useMutation({
    mutationFn: async ({ stationId, planId }: { stationId: number; planId: number }) => {
      return apiClient.superadminRequest(`superadmin-actions/stations/${stationId}/plan`, {
        method: 'PUT',
        body: JSON.stringify({ planId, isPaid: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-stations'] });
      toast({ title: "Success", description: "Plan assigned successfully" });
    },
    onError: (error: any) => {
      console.error('Assign plan error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to assign plan", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: StationFormData) => {
    if (editingStation) {
      updateStationMutation.mutate({ stationId: editingStation.id, stationData: data });
    } else {
      createStationMutation.mutate(data);
    }
  };

  const handleEdit = (station: any) => {
    setEditingStation(station);
    form.reset({
      name: station.name,
      brand: station.brand,
      address: station.address || '',
      owner_id: station.owner_id?.toString() || '',
      current_plan_id: station.current_plan_id?.toString() || '',
    });
    setIsCreateModalOpen(true);
  };

  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'HP': return 'bg-red-100 text-red-800 border-red-200';
      case 'BPCL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IOCL': return 'bg-green-100 text-green-800 border-green-200';
      case 'SHELL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RELIANCE': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading stations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Error loading stations: {error.message}</p>
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
            Platform Station Management
          </h1>
          <p className="text-muted-foreground">Manage all fuel stations across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingStation(null);
                form.reset();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Station
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingStation ? 'Edit Station' : 'Create New Station'}</DialogTitle>
                <DialogDescription>
                  {editingStation ? 'Update station information' : 'Add a new fuel station to the platform'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Station Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter station name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HP">HP</SelectItem>
                            <SelectItem value="BPCL">BPCL</SelectItem>
                            <SelectItem value="IOCL">IOCL</SelectItem>
                            <SelectItem value="SHELL">Shell</SelectItem>
                            <SelectItem value="RELIANCE">Reliance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter station address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="owner_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Station Owner</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {owners?.map((owner: any) => (
                              <SelectItem key={owner.id} value={owner.id.toString()}>
                                {owner.name || owner.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {plans && plans.length > 0 && (
                    <FormField
                      control={form.control}
                      name="current_plan_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No plan</SelectItem>
                              {plans.map((plan: any) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name} - ₹{plan.price_monthly}/month
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
                    <Button type="submit" disabled={createStationMutation.isPending || updateStationMutation.isPending}>
                      {editingStation ? 'Update Station' : 'Create Station'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            <SelectItem value="HP">HP</SelectItem>
            <SelectItem value="BPCL">BPCL</SelectItem>
            <SelectItem value="IOCL">IOCL</SelectItem>
            <SelectItem value="SHELL">Shell</SelectItem>
            <SelectItem value="RELIANCE">Reliance</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {owners?.map((owner: any) => (
              <SelectItem key={owner.id} value={owner.id.toString()}>
                {owner.name || owner.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations?.map((station: any) => (
          <Card key={station.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {station.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {station.address || 'No address provided'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getBrandColor(station.brand)} variant="outline">
                  {station.brand}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch
                    checked={station.is_active}
                    onCheckedChange={(checked) => 
                      toggleStationMutation.mutate({ 
                        stationId: station.id, 
                        isActive: checked 
                      })
                    }
                    disabled={toggleStationMutation.isPending}
                  />
                </div>
              </div>

              {station.users && (
                <div className="text-sm">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Owner:
                  </div>
                  <div className="text-xs bg-muted rounded px-2 py-1 mt-1">
                    {station.users.name || station.users.email}
                  </div>
                </div>
              )}

              {station.plans && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Current Plan:</div>
                  <div className="text-xs bg-blue-100 text-blue-800 rounded px-2 py-1 mt-1">
                    {station.plans.name} - ₹{station.plans.price_monthly}/month
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Created: {new Date(station.created_at).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(station)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                {plans && plans.length > 0 && (
                  <Select onValueChange={(planId) => assignPlanMutation.mutate({ stationId: station.id, planId: parseInt(planId) })}>
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!stations || stations.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No stations found</h3>
            <p className="text-muted-foreground">
              No stations match the current filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
