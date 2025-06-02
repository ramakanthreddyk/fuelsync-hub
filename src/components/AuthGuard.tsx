
import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import Login from '@/pages/Login';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!apiService.isAuthenticated()) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiService.getCurrentUser();
        if (response.success) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          apiService.clearToken();
        }
      } catch (error) {
        setIsAuthenticated(false);
        apiService.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
};

export default AuthGuard;
