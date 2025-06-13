import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { RequireRole } from '@/components/RequireRole';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';
import { UsersPage, StationsPage, CreateOwnerWizard } from '@/pages/SuperAdmin';
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

const queryClient = new QueryClient();

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
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            
            {/* Super Admin Routes */}
            <Route 
              path="/sa/*" 
              element={
                <ProtectedRoute>
                  <RequireRole role="superadmin">
                    <SuperAdminLayout>
                      <Routes>
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/stations" element={<StationsPage />} />
                        <Route path="/create-owner" element={<CreateOwnerWizard />} />
                        <Route path="/" element={<Navigate to="/sa/users" replace />} />
                      </Routes>
                    </SuperAdminLayout>
                  </RequireRole>
                </ProtectedRoute>
              } 
            />
            
            {/* Regular App Routes */}
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
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
