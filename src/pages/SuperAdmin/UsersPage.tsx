
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

interface Props {
  stations: any[]
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

  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_stations (
            station_id,
            user_id,
            created_at
          ),
          stations!stations_owner_id_fkey (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Transform user_stations to match UserStation type for each user
      const usersWithFullStations = (data || []).map((user: any) => ({
        ...user,
        user_stations: (user.user_stations || []).map((us: any) => ({
          station_id: us.station_id,
          user_id: us.user_id ?? user.id, // fallback if not present
          created_at: us.created_at ?? '',
        })),
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

  // Create User (insert to Supabase + assign station if needed)
  const handleCreateUser = async () => {
    try {
      setIsCreating(true);
      // Validate required fields
      if (!newUserForm.name || !newUserForm.email || !newUserForm.role) {
        toast.error('Name/email/role required');
        setIsCreating(false); return;
      }
      if ((newUserForm.role === 'employee' || newUserForm.role === 'owner') && !newUserForm.station_id) {
        toast.error('Employee/Owner must be assigned a station');
        setIsCreating(false); return;
      }

      // Create user row
      const { data: user, error: userErr } = await supabase
        .from('users')
        .insert({
          name: newUserForm.name,
          email: newUserForm.email,
          phone: newUserForm.phone,
          role: newUserForm.role,
          is_active: true,
          // password is not stored in users table, only through Auth!
        })
        .select('*').single();

      if (userErr || !user) throw userErr || new Error('Failed to create user');

      // If needed, assign to station
      if ((newUserForm.role === 'employee' || newUserForm.role === 'owner') && newUserForm.station_id) {
        // Remove prior assignment if exists (shouldn't be but for safety)
        await supabase.from('user_stations').delete().eq('user_id', user.id);
        await supabase.from('user_stations').insert({
          user_id: user.id, 
          station_id: parseInt(newUserForm.station_id, 10)
        });
      }

      toast.success("User created successfully");
      resetNewUserForm(); setShowCreateDialog(false); refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
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

  // Save Edit User (update fields + update station assignment)
  const handleEditUser = async () => {
    if (!editDialog.user) return;
    setIsUpdating(true);
    try {
      // Only send changed fields
      const updateFields: any = {};
      ['name','email','phone','role','is_active'].forEach(key => {
        if ((editForm as any)[key] !== (editDialog.user as any)[key]) {
          updateFields[key] = (editForm as any)[key];
        }
      });

      if (Object.keys(updateFields).length > 0) {
        // Supabase update
        const { error: updateError } = await supabase
          .from('users')
          .update(updateFields)
          .eq('id', editDialog.user.id);
        if (updateError) throw updateError;
      }

      // For employee/owner handle station (reset and insert fresh)
      if ((editForm.role === 'employee' || editForm.role === 'owner') && editForm.station_id) {
        await supabase.from('user_stations').delete().eq('user_id', editDialog.user.id);
        await supabase.from('user_stations').insert({
          user_id: editDialog.user.id,
          station_id: Number(editForm.station_id)
        });
      } else if (editForm.role === 'superadmin') {
        // Remove any station assignment
        await supabase.from('user_stations').delete().eq('user_id', editDialog.user.id);
      }

      toast.success("User updated successfully");
      refetch(); closeEditDialog();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update user');
    }
    setIsUpdating(false);
  };

  // Role change from grid (inline)
  const handleRoleChange = async (userId: string, newRole: 'superadmin' | 'owner' | 'employee') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
      if (error) throw error;
      // Clean up stations if superadmin, else preserve existing
      if (newRole === "superadmin") {
        await supabase.from('user_stations').delete().eq('user_id', userId);
      }
      toast.success("User role updated");
      refetch();
    } catch (e: any) { toast.error(e?.message || "Failed to update role"); }
  };

  // Status update (activate/deactivate)
  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', userId)
      if (error) throw error;
      toast.success("User status updated");
      refetch();
    } catch (e: any) { toast.error(e?.message || "Failed to update status"); }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      // Cleanup station assignment
      await supabase.from('user_stations').delete().eq('user_id', userId);
      // Delete user row
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      toast.success("User deleted successfully");
      refetch();
    } catch (e: any) { toast.error(e?.message || "Failed to delete user"); }
    setIsDeleting(false);
  };

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
              {/* Password not implemented here as auth isn't handled directly via users table */}
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
                  <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as 'superadmin' | 'owner' | 'employee')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
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
                      handleStatusChange(
                        user.id,
                        !user.is_active
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
