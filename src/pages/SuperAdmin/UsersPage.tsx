import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuth } from "@/hooks/useAuth";
// Use FULL Supabase Functions URL
const API_BASE_URL = 'https://untzkhbbsowpkmwrxdws.supabase.co/functions/v1';
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
  const [editForm, setEditForm] = useState<{ name: string; email: string; phone: string; role: User['role']; is_active: boolean, station_id?: number }>({ name: '', email: '', phone: '', role: 'employee', is_active: true });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { session } = useAuth();

  const getAuthToken = () => session?.access_token || "";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { success, data }
        setUsers(data.data || []);
      } else {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setIsFetching(false);
    }
  };

  const refetch = () => {
    fetchUsers();
  };

  const resetNewUserForm = () => {
    setNewUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'employee',
      password: '',
      station_id: ''
    });
  };

  const handleRoleChange = async (userId: string, newRole: 'superadmin' | 'owner' | 'employee') => {
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin-users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        toast.success('User role updated successfully');
        refetch();
      } else {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user role');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin-users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      if (response.ok) {
        toast.success('User status updated successfully');
        refetch();
      } else {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin-users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('User deleted successfully');
        refetch();
      } else {
        throw new Error(data?.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
    setIsDeleting(false);
  };

  const openEditDialog = (user: User) => {
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
      // If station_id comes as string, convert to number or undefined
      station_id: user.station_id ? Number(user.station_id) : undefined
    });
    setEditDialog({ open: true, user });
  };
  const closeEditDialog = () => {
    setEditDialog({ open: false, user: undefined });
  };

  const handleEditUser = async () => {
    if (!editDialog.user) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin-users/${editDialog.user.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('User details updated');
        refetch();
        closeEditDialog();
      } else {
        throw new Error(data?.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
    setIsUpdating(false);
  };

  const handleCreateUser = async () => {
    try {
      setIsCreating(true);
      const userData: any = {
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone,
        role: newUserForm.role,
        password: newUserForm.password
      };
      // Employee: assign to station
      if (newUserForm.role === 'employee' && newUserForm.station_id) {
        userData.station_id = parseInt(newUserForm.station_id, 10);
      }
      // Owner: if selected station (for old owner), else require new station fields
      if (newUserForm.role === 'owner' && newUserForm.station_id) {
        userData.station_id = parseInt(newUserForm.station_id, 10);
      }
      // let the backend determine creation flow
      const response = await fetch(`${API_BASE_URL}/superadmin-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('User created successfully');
        resetNewUserForm();
        setShowCreateDialog(false);
        refetch();
      } else {
        throw new Error(data?.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
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
                <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value as 'superadmin' | 'owner' | 'employee' })}>
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
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
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
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
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
