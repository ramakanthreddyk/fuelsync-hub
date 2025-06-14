
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { RequireRole } from '@/components/RequireRole';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';
import { 
  UsersPage, 
  StationsPage, 
  PumpsPage, 
  PlansPage, 
  AnalyticsPage, 
  CreateOwnerWizard 
} from '@/pages/SuperAdmin';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import AdminUsers from '@/pages/AdminUsers';
import AdminStations from '@/pages/AdminStations';
import Upload from '@/pages/Upload';
import Sales from '@/pages/Sales';
import DailyClosure from '@/pages/DailyClosure';
import Pumps from '@/pages/Pumps';
import Prices from '@/pages/Prices';
import Reports from '@/pages/Reports';
import AppLayout from '@/components/AppLayout';
import { supabase } from "@/integrations/supabase/client";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    // Role-based redirect after login
    if (user.role === 'superadmin') {
      return <Navigate to="/superadmin/users" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function RoleBasedRedirect() {
  const { user } = useAuth();
  
  if (user?.role === 'superadmin') {
    return <Navigate to="/superadmin/users" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

function useStationsForSuperAdmin() {
  return useQuery({
    queryKey: ["all-stations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stations").select("id, name, brand");
      if (error) throw error;
      return data || [];
    }
  });
}

export function AppWithQueries() {
  const stationsQuery = useStationsForSuperAdmin();

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Super Admin Routes - Completely separate from owner/employee routes */}
          <Route 
            path="/superadmin/*" 
            element={
              <ProtectedRoute>
                <RequireRole role="superadmin">
                  <SuperAdminLayout>
                    <Routes>
                      <Route
                        path="/users"
                        element={
                          stationsQuery.isLoading
                            ? (
                                <div className="flex items-center justify-center min-h-screen">Loading stations…</div>
                              )
                            : (
                                <UsersPage stations={stationsQuery.data || []} />
                              )
                        }
                      />
                      <Route path="/stations" element={<StationsPage />} />
                      <Route path="/pumps" element={<PumpsPage />} />
                      <Route path="/plans" element={<PlansPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/create-owner" element={<CreateOwnerWizard />} />
                      <Route path="/" element={<Navigate to="/superadmin/users" replace />} />
                    </Routes>
                  </SuperAdminLayout>
                </RequireRole>
              </ProtectedRoute>
            } 
          />
          
          {/* Regular App Routes - For owners and employees only */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/daily-closure" element={<DailyClosure />} />
                    <Route path="/pumps" element={<Pumps />} />
                    <Route path="/prices" element={<Prices />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/stations" element={<AdminStations />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/" element={<RoleBasedRedirect />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}
