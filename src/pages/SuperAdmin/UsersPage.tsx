
import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { User } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Use the public anon key directly
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudHpraGJic293cGttd3J4ZHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTQ2ODAsImV4cCI6MjA2NTI5MDY4MH0.aEJHq7lKjbKMa0JIqxIT9wjfMY4PGd1bTkC-t2smSGs";
const SUPABASE_URL = "https://untzkhbbsowpkmwrxdws.supabase.co";

interface Props {
  stations: any[];
}

const UsersPage = ({ stations }: Props) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee' as 'superadmin' | 'owner' | 'employee',
    password: '',
    station_id: ''
  });
  const [isFetching, setIsFetching] = useState(true);
  const [editDialog, setEditDialog] = useState<{ open: boolean; user?: User }>({ open: false });
  const [editForm, setEditForm] = useState<{ name: string; email: string; phone: string; role: User['role']; is_active: boolean, station_id?: number, password?: string }>({ name: '', email: '', phone: '', role: 'employee', is_active: true });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  // Helper to get current auth token (async)
  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    return data?.session?.access_token || '';
  };

  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      const access_token = await getAccessToken();
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/superadmin-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      const { success, data, error } = await resp.json();
      if (!success) throw new Error(error || "Failed to fetch users");
      // Defensive: ensure both stations and user_stations exist, always arrays
      const usersWithFullStations = (data || []).map((user: any) => ({
        ...user,
        user_stations: Array.isArray(user.user_stations)
          ? user.user_stations.map((us: any) => ({
            user_id: us.user_id ?? user.id,
            station_id: us.station_id,
            created_at: us.created_at ?? '',
          }))
          : [],
        stations: Array.isArray(user.stations)
          ? user.stations.map((s: any) => ({
            id: s.id,
            name: s.name,
            brand: s.brand,
            address: s.address,
          }))
          : [],
      }));
      setUsers(usersWithFullStations);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch users');
    } finally {
      setIsFetching(false);
    }
  };

  const refetch = () => fetchUsers();

  const resetNewUserForm = () => setNewUserForm({
    name: '', email: '', phone: '', role: 'employee', password: '', station_id: ''
  });

  // Create User (only employees/owners get stations)
  const handleCreateUser = async () => {
    try {
      setIsCreating(true);
      if (!newUserForm.name || !newUserForm.email || !newUserForm.role) {
        toast.error('Name/email/role required');
        setIsCreating(false); return;
      }
      // Only require station for employee/owner, not for superadmin
      if ((newUserForm.role === 'employee' || newUserForm.role === 'owner') && !newUserForm.station_id) {
        toast.error('Employee/Owner must be assigned a station');
        setIsCreating(false); return;
      }
      const payload: any = {
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone,
        role: newUserForm.role,
      };
      if (newUserForm.role !== 'superadmin') {
        payload.station_id = newUserForm.station_id;
      }

      const access_token = await getAccessToken();
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/superadmin-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const { success, data, error } = await resp.json();
      if (!success) throw new Error(error || "Failed to create user");
      toast.success("User created successfully");
      resetNewUserForm(); setShowCreateDialog(false); fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  // Edit User
  const handleEditUser = async () => {
    if (!editDialog.user) return;
    setIsUpdating(true);
    try {
      const updateFields: any = {};
      ['name', 'email', 'phone', 'role', 'is_active'].forEach(key => {
        if ((editForm as any)[key] !== (editDialog.user as any)[key]) {
          updateFields[key] = (editForm as any)[key];
        }
      });
      if ((editForm.role === "employee" || editForm.role === "owner") && editForm.station_id) {
        updateFields.station_id = editForm.station_id;
      }
      const access_token = await getAccessToken();
      const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/superadmin-users/${editDialog.user.id}/edit`,
        {
          method: "PUT",
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateFields)
        }
      );
      const { success, data, error } = await resp.json();
      if (!success) throw new Error(error || "Failed to update user");
      toast.success("User updated successfully");
      fetchUsers();
      closeEditDialog();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update user');
    }
    setIsUpdating(false);
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const access_token = await getAccessToken();
      const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/superadmin-users/${userId}`,
        {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      const { success, error } = await resp.json();
      if (!success && error?.includes('activity log')) {
        toast.error("Cannot delete user due to activity logs. Remove logs and try again.");
        return;
      }
      if (!success) throw new Error(error || "Failed to delete user");
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete user");
    }
    setIsDeleting(false);
  };

  // Edit User Dialog
  const openEditDialog = (user: User) => {
    let stationId: number | undefined = undefined;
    if (user.role === 'employee' && user.user_stations && user.user_stations.length > 0) {
      stationId = user.user_stations[0].station_id;
    } else if (user.role === 'owner' && user.stations && user.stations.length > 0) {
      stationId = user.stations[0].id;
    }
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
      station_id: stationId,
      password: ''
    });
    setEditDialog({ open: true, user });
  };

  const closeEditDialog = () => setEditDialog({ open: false, user: undefined });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value as 'superadmin' | 'owner' | 'employee', station_id: '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Only owners/employees need station selection */}
              {(newUserForm.role === 'owner' || newUserForm.role === 'employee') && (
                <div>
                  <Label htmlFor="station">Station</Label>
                  <Select value={newUserForm.station_id} onValueChange={(value) => setNewUserForm({ ...newUserForm, station_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations?.map((station: any) => (
                        <SelectItem key={station.id} value={station.id.toString()}>
                          {station.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editDialog.open} onOpenChange={(open) => { if (!open) closeEditDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={value => setEditForm(f => ({ ...f, role: value as User['role'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Only show station edit for owner/employee */}
            {((editForm.role === 'employee' && stations.length > 0) || (editForm.role === 'owner' && stations.length > 0)) && (
              <div>
                <Label htmlFor="edit-station">Station</Label>
                <Select value={editForm.station_id ? editForm.station_id.toString() : ''} onValueChange={value => setEditForm(f => ({ ...f, station_id: Number(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station: any) => (
                      <SelectItem key={station.id} value={station.id.toString()}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Status</Label>
              <Button
                variant={editForm.is_active ? "outline" : "default"}
                onClick={() => setEditForm(f => ({ ...f, is_active: !f.is_active }))}
              >
                {editForm.is_active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isFetching ? (
        <p>Loading users...</p>
      ) : (
        <Table>
          <TableCaption>A list of all users in your account.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  {/* Station/owner can change; superadmin cannot have station */}
                  <span className="capitalize">{user.role}</span>
                </TableCell>
                <TableCell>
                  {user.role === 'superadmin' ? (
                    <span>-</span>
                  ) : (
                    (user.stations && user.stations.length > 0)
                      ? user.stations[0].name
                      : ((user.user_stations && user.user_stations.length > 0 && stations) ?
                          (() => {
                            const assignedStation = stations.find((s: any) => s.id === user.user_stations[0].station_id);
                            return assignedStation ? assignedStation.name : <span className="text-red-500">None</span>;
                          })()
                        : <span className="text-red-500">None</span>
                        )
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleEditUser(
                        openEditDialog(user)
                      )
                    }
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default UsersPage;
