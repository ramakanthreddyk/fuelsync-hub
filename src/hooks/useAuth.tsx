
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
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        // Defer user data fetching to avoid blocking auth state changes
        setTimeout(() => {
          fetchUserData(session.user.email!);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.email!);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (email: string) => {
    try {
      console.log('Fetching user data for:', email);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('User data found:', userData);

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

      console.log('Setting user:', transformedUser);
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
      console.log('Attempting login for:', email);
      
      // First check if user exists in our system
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        throw new Error('Invalid credentials or account not found');
      }

      console.log('User found in system:', userData);

      // Attempt sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign-in error:', signInError.message);
        
        // Handle specific confirmation error
        if (signInError.message.includes('Email not confirmed') || 
            signInError.message.includes('email_not_confirmed') ||
            signInError.message.includes('signup_disabled')) {
          throw new Error('Email not confirmed');
        }
        
        throw new Error('Invalid credentials');
      }

      console.log('Login successful for:', email);
      // User data will be set by the auth state change listener
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
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
