import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import AdminUsers from '@/pages/AdminUsers';
import AdminStations from '@/pages/AdminStations';
import Upload from '@/pages/Upload';
import Sales from '@/pages/Sales';
import DailyClosure from '@/pages/DailyClosure';
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
