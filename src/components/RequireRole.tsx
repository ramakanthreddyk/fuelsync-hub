
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';

interface RequireRoleProps {
  role: 'superadmin' | 'owner' | 'employee';
  children: React.ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Authentication required</p>
        </CardContent>
      </Card>
    );
  }

  if (user.role !== role) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Access denied. This page requires {role} privileges.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
