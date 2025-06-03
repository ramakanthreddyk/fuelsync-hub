
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notifications, setNotifications] = useState(true);
  const [autoReports, setAutoReports] = useState(false);

  // Fetch user details with plan information
  const { data: userDetails } = useQuery({
    queryKey: ['user-details'],
    queryFn: async () => {
      const response = await apiService.getCurrentUser();
      return response.data;
    }
  });

  const handleSaveProfile = () => {
    // TODO: Implement profile update API
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleChangePassword = () => {
    // TODO: Implement password change API
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });
  };

  // Get plan details with fallback
  const planName = userDetails?.plan?.name || 'Basic';
  const customLimits = userDetails?.customLimits || {};

  // Define plan limits with defaults
  const defaultLimits = {
    Basic: { maxUploadsPerDay: 5, maxEmployees: 2, maxPumps: 3, maxStations: 1 },
    Premium: { maxUploadsPerDay: 10, maxEmployees: 5, maxPumps: 5, maxStations: 1 },
    Enterprise: { maxUploadsPerDay: -1, maxEmployees: -1, maxPumps: -1, maxStations: -1 }
  };

  const planLimits = defaultLimits[planName] || defaultLimits.Basic;
  const effectiveLimits = { ...planLimits, ...customLimits };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span>
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={user?.role || 'Employee'}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Contact your administrator to change your role
                </p>
              </div>
              
              <Button onClick={handleSaveProfile} className="w-full md:w-auto">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔒</span>
                Security
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <Button onClick={handleChangePassword} variant="outline" className="w-full md:w-auto">
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span>
                Preferences
              </CardTitle>
              <CardDescription>
                Configure your app preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-reports">Auto Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate daily reports
                  </p>
                </div>
                <Switch
                  id="auto-reports"
                  checked={autoReports}
                  onCheckedChange={setAutoReports}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span>
                Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge variant="outline" className="px-3 py-1 text-lg">
                  {planName} Plan
                </Badge>
                {customLimits && Object.keys(customLimits).length > 0 && (
                  <p className="text-xs text-orange-600 mt-1">Custom limits applied</p>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Uploads</span>
                  <span className="font-medium">
                    {effectiveLimits.maxUploadsPerDay === -1 ? 'Unlimited' : effectiveLimits.maxUploadsPerDay}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Employees</span>
                  <span className="font-medium">
                    {effectiveLimits.maxEmployees === -1 ? 'Unlimited' : effectiveLimits.maxEmployees}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Pumps</span>
                  <span className="font-medium">
                    {effectiveLimits.maxPumps === -1 ? 'Unlimited' : effectiveLimits.maxPumps}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Stations</span>
                  <span className="font-medium">
                    {effectiveLimits.maxStations === -1 ? 'Unlimited' : effectiveLimits.maxStations}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Need to upgrade?</p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📈</span>
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploads Today</span>
                  <span className="font-medium">0</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Uploads</span>
                  <span className="font-medium">0</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Since</span>
                  <span className="font-medium">
                    {userDetails?.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
