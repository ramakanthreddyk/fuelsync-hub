import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Station, Plan } from '@/types/database';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load stations
      const { data: stationsData } = await supabase.from('stations').select('*');
      setStations(stationsData || []);

      // Load plans
      const { data: plansData } = await supabase.from('plans').select('*');
      // Type cast features from Json to Record<string, any>
      setPlans((plansData || []).map(plan => ({
        ...plan,
        features: (plan.features as Record<string, any>) || {}
      })));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const currentStation = user?.stations?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and system settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your account details and role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={user.name || ''} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div>
              <Label>Role</Label>
              <Badge variant="outline" className="capitalize">
                {user.role}
              </Badge>
            </div>
            <div>
              <Label>Account Created</Label>
              <Input value={new Date(user.created_at).toLocaleDateString()} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Station Information</CardTitle>
            <CardDescription>
              {user.role === 'superadmin' ? 'System overview' : 'Your station details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.role === 'superadmin' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Stations: {stations.length}</p>
                <p className="text-sm font-medium">Available Plans: {plans.length}</p>
                <p className="text-sm text-muted-foreground">
                  You have full system access
                </p>
              </div>
            ) : currentStation ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Station ID: {currentStation.id}</p>
                <p className="text-sm text-muted-foreground">
                  Station details and settings
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No station assigned
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {user.role === 'superadmin' && (
        <Card>
          <CardHeader>
            <CardTitle>System Management</CardTitle>
            <CardDescription>
              Superadmin tools and controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" onClick={() => window.location.href = '/admin/users'}>
                Manage Users
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/admin/stations'}>
                Manage Stations
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/admin/plans'}>
                Manage Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
