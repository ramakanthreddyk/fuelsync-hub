
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      ocrUpdates: true,
      priceAlerts: false,
      maintenanceReminders: true,
      dailyReports: false
    },
    preferences: {
      theme: 'light',
      language: 'en',
      currency: 'INR',
      timezone: 'Asia/Kolkata'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      passwordExpiry: '90'
    }
  });

  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const updateNotificationSetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const updateSecuritySetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }));
  };

  // Get plan limits based on user's role and plan
  const getPlanLimits = () => {
    if (!user) return null;
    
    // Default plan limits
    const planLimits = {
      Basic: { maxEmployees: 2, maxPumps: 3, maxStations: 1, maxUploadsPerDay: 5 },
      Premium: { maxEmployees: 5, maxPumps: 5, maxStations: 1, maxUploadsPerDay: 10 },
      Enterprise: { maxEmployees: 'Unlimited', maxPumps: 'Unlimited', maxStations: 'Unlimited', maxUploadsPerDay: 'Unlimited' }
    };

    return planLimits[user.plan as keyof typeof planLimits] || planLimits.Basic;
  };

  const currentLimits = getPlanLimits();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings, preferences, and system configuration.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span>
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user?.name || "Loading..."} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user?.email || "Loading..."} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+91 98765 43210" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue={user?.role || "Loading..."} disabled />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings}>
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏢</span>
                Station Information
              </CardTitle>
              <CardDescription>
                Manage your fuel station details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="station-name">Station Name</Label>
                  <Input id="station-name" defaultValue="City Fuel Station" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="station-id">Station ID</Label>
                  <Input id="station-id" defaultValue={user?.stationId || "N/A"} disabled />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="123 Main Street, City Name, State - 400001" />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings}>
                Update Station Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔔</span>
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">OCR Processing Updates</p>
                    <p className="text-sm text-muted-foreground">Get notified when receipt processing is complete</p>
                  </div>
                  <Switch
                    checked={settings.notifications.ocrUpdates}
                    onCheckedChange={(checked) => updateNotificationSetting('ocrUpdates', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Price Change Alerts</p>
                    <p className="text-sm text-muted-foreground">Notifications when fuel prices are updated</p>
                  </div>
                  <Switch
                    checked={settings.notifications.priceAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting('priceAlerts', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Reminders</p>
                    <p className="text-sm text-muted-foreground">Reminders for scheduled pump maintenance</p>
                  </div>
                  <Switch
                    checked={settings.notifications.maintenanceReminders}
                    onCheckedChange={(checked) => updateNotificationSetting('maintenanceReminders', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Reports</p>
                    <p className="text-sm text-muted-foreground">Automatic daily sales summary emails</p>
                  </div>
                  <Switch
                    checked={settings.notifications.dailyReports}
                    onCheckedChange={(checked) => updateNotificationSetting('dailyReports', checked)}
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveSettings}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔒</span>
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => updateSecuritySetting('twoFactorAuth', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSecuritySetting('sessionTimeout', e.target.value)}
                    className="w-32"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                  <Input
                    id="password-expiry"
                    type="number"
                    value={settings.security.passwordExpiry}
                    onChange={(e) => updateSecuritySetting('passwordExpiry', e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Button onClick={handleSaveSettings}>
                  Save Security Settings
                </Button>
                <Button variant="outline" className="ml-3">
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💳</span>
                Current Plan & Limits
              </CardTitle>
              <CardDescription>
                Manage your subscription and view your current limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg bg-primary/5">
                <div>
                  <h3 className="font-semibold text-lg">{user?.plan || 'Basic'} Plan</h3>
                  <p className="text-sm text-muted-foreground">Your current subscription plan</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  Active
                </Badge>
              </div>

              {/* Current Limits */}
              {currentLimits && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Your Current Limits</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Max Employees:</span>
                      <span className="ml-2 font-medium">{currentLimits.maxEmployees}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Pumps:</span>
                      <span className="ml-2 font-medium">{currentLimits.maxPumps}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Stations:</span>
                      <span className="ml-2 font-medium">{currentLimits.maxStations}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Daily Uploads:</span>
                      <span className="ml-2 font-medium">{currentLimits.maxUploadsPerDay}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Basic Plan</h4>
                  <p className="text-2xl font-bold mb-2">₹999<span className="text-sm font-normal">/month</span></p>
                  <p className="text-xs text-orange-600 mb-3">3-month free trial</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 2 employees max</li>
                    <li>• 3 pumps max</li>
                    <li>• 5 uploads/day</li>
                    <li>• Basic analytics</li>
                  </ul>
                </Card>
                
                <Card className="p-4 border-primary shadow-lg">
                  <h4 className="font-medium mb-2">Premium Plan</h4>
                  <p className="text-2xl font-bold mb-2">₹2,499<span className="text-sm font-normal">/month</span></p>
                  <p className="text-xs text-orange-600 mb-3">14-day free trial</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 5 employees max</li>
                    <li>• 5 pumps max</li>
                    <li>• 10 uploads/day</li>
                    <li>• Advanced analytics</li>
                    <li>• Export reports</li>
                  </ul>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Enterprise Plan</h4>
                  <p className="text-2xl font-bold mb-2">Custom<span className="text-sm font-normal"> pricing</span></p>
                  <p className="text-xs text-orange-600 mb-3">Arrange a call</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Unlimited employees</li>
                    <li>• Unlimited pumps</li>
                    <li>• Unlimited uploads</li>
                    <li>• Multi-station support</li>
                    <li>• Custom integrations</li>
                  </ul>
                </Card>
              </div>
              
              <div className="flex gap-3">
                <Button>
                  Upgrade Plan
                </Button>
                <Button variant="outline">
                  Billing History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
