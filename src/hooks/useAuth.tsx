
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  role: 'superadmin' | 'owner' | 'employee';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stations: Array<{
    id: number;
    name: string;
    brand: string;
    address: string | null;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const storedUser = localStorage.getItem('fuelsync_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_stations!inner(
            stations(
              id,
              name,
              brand,
              address
            )
          )
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      // Transform the data to match our User interface
      const transformedUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        stations: data.user_stations?.map((us: any) => us.stations) || []
      };

      return transformedUser;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userData = await fetchUserData(email);

      if (!userData) {
        throw new Error('Invalid credentials or account not found');
      }

      console.log('Login attempt for:', email);

      setUser(userData);
      localStorage.setItem('fuelsync_user', JSON.stringify(userData));
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('fuelsync_user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const signOut = logout;

  const value = {
    user,
    loading,
    login,
    logout,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
