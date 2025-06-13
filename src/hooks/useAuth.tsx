import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Session } from '@supabase/supabase-js';

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
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserData(session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (email: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        setUser(null);
        return;
      }

      let stations = [];

      if (userData.role === 'owner') {
        const { data: stationsData, error: stationsError } = await supabase
          .from('stations')
          .select('id, name, brand, address')
          .eq('owner_id', userData.id);
        stations = stationsData || [];
      } else if (userData.role === 'employee') {
        const { data: userStationsData, error: userStationsError } = await supabase
          .from('user_stations')
          .select('stations ( id, name, brand, address )')
          .eq('user_id', userData.id);

        if (userStationsData) {
          stations = userStationsData.map((us: any) => us.stations).filter(Boolean);
        }
      } else if (userData.role === 'superadmin') {
        const { data: stationsData, error: stationsError } = await supabase
          .from('stations')
          .select('id, name, brand, address')
          .limit(5);
        stations = stationsData || [];
      }

      const transformedUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        stations,
      };

      setUser(transformedUser);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        throw new Error('Invalid credentials or account not found');
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign-in error:', signInError.message);
        
        // Handle specific confirmation error with more detail
        if (signInError.message.includes('Email not confirmed') || 
            signInError.message.includes('email_not_confirmed')) {
          throw new Error('Your account requires email confirmation. Please contact support if this issue persists.');
        }
        
        throw new Error('Invalid credentials');
      }

      // session and user will be set by the auth listener
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isLoggedIn: !!user && !!session,
    login,
    logout,
    signOut: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
