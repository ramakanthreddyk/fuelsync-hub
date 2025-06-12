import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface User {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
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
      // First get the user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      // Then get the stations for this user based on role
      let stations = [];
      if (userData.role === 'owner') {
        // For owners, get stations they own
        const { data: stationsData, error: stationsError } = await supabase
          .from('stations')
          .select('id, name, brand, address')
          .eq('owner_id', userData.id);

        if (!stationsError && stationsData) {
          stations = stationsData;
        }
      } else if (userData.role === 'employee') {
        // For employees, get stations via user_stations table
        const { data: userStationsData, error: userStationsError } = await supabase
          .from('user_stations')
          .select(`
            stations (
              id,
              name,
              brand,
              address
            )
          `)
          .eq('user_id', userData.id);

        if (!userStationsError && userStationsData) {
          stations = userStationsData.map((us: any) => us.stations).filter(Boolean);
        }
      } else if (userData.role === 'superadmin') {
        // For superadmin, get all stations
        const { data: stationsData, error: stationsError } = await supabase
          .from('stations')
          .select('id, name, brand, address')
          .limit(5); // Limit for demo

        if (!stationsError && stationsData) {
          stations = stationsData;
        }
      }

      // Transform the data to match our User interface
      const transformedUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        stations: stations || []
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

      // For demo purposes, we'll accept the passwords from the seed data
      // In production, you'd verify the password hash
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
