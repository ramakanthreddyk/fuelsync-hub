import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { UserConfirmationManager } from "@/components/UserConfirmationManager";
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Building2,
  Phone,
  Mail
} from "lucide-react";

interface User {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stations: Array<{
    id: number;
    name: string;
    brand: string;
    address: string | null;
  }>;
}

interface Station {
  id: number;
  name: string;
  brand: string;
  address: string | null;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('employee');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [assignedStations, setAssignedStations] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchStations();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.superadminRequest('superadmin-users');
      setUsers(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const data = await apiClient.superadminRequest('superadmin-stations');
      setStations(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch stations",
        variant: "destructive",
      });
    }
  };

  const createUser = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.superadminRequest('superadmin-actions', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_user',
          name,
          email,
          phone,
          role,
          is_active: isActive,
          password,
          assigned_stations: assignedStations,
        }),
      });

      toast({
        title: "Success",
        description: "User created successfully",
      });
      fetchUsers();
      setShowCreateModal(false);
      clearForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.superadminRequest('superadmin-actions', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_user',
          id: selectedUser?.id,
          name,
          email,
          phone,
          role,
          is_active: isActive,
          assigned_stations: assignedStations,
        }),
      });

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      fetchUsers();
      setShowEditModal(false);
      clearForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: number) => {
    setIsLoading(true);
    try {
      await apiClient.superadminRequest('superadmin-actions', {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete_user',
          id,
        }),
      });

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('employee');
    setIsActive(true);
    setPassword('');
    setAssignedStations([]);
    setSelectedUser(null);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setName(user.name || '');
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setIsActive(user.is_active);
    setAssignedStations(user.stations.map(station => station.id));
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage all users across the platform</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchUsers} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Add the User Confirmation Manager */}
      <UserConfirmationManager />

      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>View and manage existing users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_active ? (
                        <Badge variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Create New User
                </h3>
                <div className="mt-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                      <input type="text" name="name" id="name" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" name="email" id="email" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="text" name="phone" id="phone" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                      <select id="role" name="role" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="employee">Employee</option>
                        <option value="owner">Owner</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                      <input type="password" name="password" id="password" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <label className="inline-flex items-center mt-2">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        <span className="ml-2 text-gray-900">Active</span>
                      </label>
                    </div>

                    {role !== 'superadmin' && (
                      <div className="col-span-6">
                        <label className="block text-sm font-medium text-gray-700">Assign Stations</label>
                        <div className="mt-1">
                          {stations.map((station) => (
                            <label key={station.id} className="inline-flex items-center mr-4">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-blue-600"
                                value={station.id}
                                checked={assignedStations.includes(station.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAssignedStations([...assignedStations, station.id]);
                                  } else {
                                    setAssignedStations(assignedStations.filter((id) => id !== station.id));
                                  }
                                }}
                              />
                              <span className="ml-2 text-gray-900">{station.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={createUser} disabled={isLoading}>
                  Create
                </Button>
                <Button variant="ghost" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowCreateModal(false)} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Edit User
                </h3>
                <div className="mt-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                      <input type="text" name="name" id="name" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" name="email" id="email" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="text" name="phone" id="phone" className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                      <select id="role" name="role" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="employee">Employee</option>
                        <option value="owner">Owner</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <label className="inline-flex items-center mt-2">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        <span className="ml-2 text-gray-900">Active</span>
                      </label>
                    </div>

                    {role !== 'superadmin' && (
                      <div className="col-span-6">
                        <label className="block text-sm font-medium text-gray-700">Assign Stations</label>
                        <div className="mt-1">
                          {stations.map((station) => (
                            <label key={station.id} className="inline-flex items-center mr-4">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-blue-600"
                                value={station.id}
                                checked={assignedStations.includes(station.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAssignedStations([...assignedStations, station.id]);
                                  } else {
                                    setAssignedStations(assignedStations.filter((id) => id !== station.id));
                                  }
                                }}
                              />
                              <span className="ml-2 text-gray-900">{station.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={updateUser} disabled={isLoading}>
                  Save
                </Button>
                <Button variant="ghost" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowEditModal(false)} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
