
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import Sales from '@/pages/Sales';
import Pumps from '@/pages/Pumps';
import Prices from '@/pages/Prices';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import { useAuth } from '@/hooks/useAuth';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Role-based route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Employee: Upload only */}
            <Route path="upload" element={
              <ProtectedRoute allowedRoles={['Employee', 'Pump Owner', 'Manager', 'Super Admin']}>
                <Upload />
              </ProtectedRoute>
            } />
            
            {/* Owner and above: Sales, Pumps, Prices */}
            <Route path="sales" element={
              <ProtectedRoute allowedRoles={['Pump Owner', 'Manager', 'Super Admin']}>
                <Sales />
              </ProtectedRoute>
            } />
            
            <Route path="pumps" element={
              <ProtectedRoute allowedRoles={['Pump Owner', 'Manager', 'Super Admin']}>
                <Pumps />
              </ProtectedRoute>
            } />
            
            <Route path="prices" element={
              <ProtectedRoute allowedRoles={['Pump Owner', 'Manager', 'Super Admin']}>
                <Prices />
              </ProtectedRoute>
            } />
            
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['Pump Owner', 'Manager', 'Super Admin']}>
                <Reports />
              </ProtectedRoute>
            } />
            
            {/* All roles can access settings */}
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
