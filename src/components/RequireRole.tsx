
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';

interface RequireRoleProps {
  role: 'superadmin' | 'owner' | 'employee';
  children: React.ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
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

  if (user.role !== role) {
    // Redirect based on actual role
    if (user.role === 'superadmin') {
      return <Navigate to="/superadmin/users" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
