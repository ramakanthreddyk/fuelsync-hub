
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/api";
import { Building2, Plus, Search, Edit, Trash2 } from "lucide-react";

interface Station {
  id: number;
  name: string;
  brand: 'IOCL' | 'BPCL' | 'HPCL';
  address: string | null;
  owner_id: number;
  current_plan_id: number | null;
  is_active: boolean;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
  plans?: {
    name: string;
    price_monthly: number;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Plan {
  id: number;
  name: string;
  price_monthly: number;
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: 'IOCL' as 'IOCL' | 'BPCL' | 'HPCL',
    address: '',
    owner_id: '',
    current_plan_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stationsData, usersData, plansData] = await Promise.all([
        apiClient.superadminRequest('superadmin-stations'),
        apiClient.superadminRequest('superadmin-users'),
        apiClient.superadminRequest('superadmin-plans')
      ]);
      
      setStations(stationsData);
      setUsers(usersData.filter((user: User) => user.role === 'owner'));
      setPlans(plansData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStation = async () => {
    if (!formData.name || !formData.brand || !formData.owner_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiClient.superadminRequest('superadmin-stations', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          owner_id: parseInt(formData.owner_id),
          current_plan_id: formData.current_plan_id ? parseInt(formData.current_plan_id) : null
        }),
      });

      toast({
        title: "Station Created",
        description: "Station has been created successfully",
      });

      setIsCreateOpen(false);
      setFormData({ name: '', brand: 'IOCL', address: '', owner_id: '', current_plan_id: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error creating station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create station",
        variant: "destructive",
      });
    }
  };

  const handleEditStation = async () => {
    if (!selectedStation) return;

    try {
      await apiClient.superadminRequest('superadmin-stations', {
        method: 'PUT',
        body: JSON.stringify({
          id: selectedStation.id,
          ...formData,
          owner_id: parseInt(formData.owner_id),
          current_plan_id: formData.current_plan_id ? parseInt(formData.current_plan_id) : null
        }),
      });

      toast({
        title: "Station Updated",
        description: "Station has been updated successfully",
      });

      setIsEditOpen(false);
      setSelectedStation(null);
      setFormData({ name: '', brand: 'IOCL', address: '', owner_id: '', current_plan_id: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error updating station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update station",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStation = async (stationId: number) => {
    try {
      await apiClient.superadminRequest(`superadmin-stations?id=${stationId}`, {
        method: 'DELETE',
      });

      toast({
        title: "Station Deleted",
        description: "Station has been deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting station:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete station",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (station: Station) => {
    setSelectedStation(station);
    setFormData({
      name: station.name,
      brand: station.brand,
      address: station.address || '',
      owner_id: station.owner_id.toString(),
      current_plan_id: station.current_plan_id?.toString() || ''
    });
    setIsEditOpen(true);
  };

  const filteredStations = stations.filter(station => 
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.users?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBrandBadge = (brand: string) => {
    const variants = {
      IOCL: 'default',
      BPCL: 'secondary',
      HPCL: 'outline'
    } as const;
    
    return <Badge variant={variants[brand as keyof typeof variants] || 'default'}>{brand}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stations Management</h1>
          <p className="text-muted-foreground">Manage all fuel stations</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Station
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Station</DialogTitle>
              <DialogDescription>
                Add a new fuel station to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Station Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter station name"
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Select value={formData.brand} onValueChange={(value: any) => setFormData({ ...formData, brand: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
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
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter station address"
                />
              </div>
              <div>
                <Label htmlFor="owner">Owner *</Label>
                <Select value={formData.owner_id} onValueChange={(value) => setFormData({ ...formData, owner_id: value })}>
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
                <Label htmlFor="plan">Plan</Label>
                <Select value={formData.current_plan_id} onValueChange={(value) => setFormData({ ...formData, current_plan_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Plan</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} (₹{plan.price_monthly}/month)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStation}>Create Station</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Stations
          </CardTitle>
          <CardDescription>
            Total stations: {stations.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading stations...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell>{getBrandBadge(station.brand)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{station.users?.name || 'No owner'}</div>
                        <div className="text-sm text-muted-foreground">{station.users?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {station.plans ? (
                        <div>
                          <div className="font-medium">{station.plans.name}</div>
                          <div className="text-sm text-muted-foreground">₹{station.plans.price_monthly}/month</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No plan</span>
                      )}
                    </TableCell>
                    <TableCell>{station.address || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={station.is_active ? 'default' : 'destructive'}>
                        {station.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(station)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Station</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {station.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteStation(station.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Station</DialogTitle>
            <DialogDescription>
              Update station information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Station Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter station name"
              />
            </div>
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Select value={formData.brand} onValueChange={(value: any) => setFormData({ ...formData, brand: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IOCL">IOCL</SelectItem>
                  <SelectItem value="BPCL">BPCL</SelectItem>
                  <SelectItem value="HPCL">HPCL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter station address"
              />
            </div>
            <div>
              <Label htmlFor="edit-owner">Owner</Label>
              <Select value={formData.owner_id} onValueChange={(value) => setFormData({ ...formData, owner_id: value })}>
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
              <Label htmlFor="edit-plan">Plan</Label>
              <Select value={formData.current_plan_id} onValueChange={(value) => setFormData({ ...formData, current_plan_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Plan</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} (₹{plan.price_monthly}/month)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStation}>Update Station</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
