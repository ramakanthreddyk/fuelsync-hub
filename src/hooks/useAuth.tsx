
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Session } from '@supabase/supabase-js';

type UserRole = Database['public']['Enums']['user_role'];

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
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
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (userError || !userData) {
        setUser(null);
        setLoading(false);
        return;
      }

      let stations = [];

      // role fallback (for older users, should always exist due to default in db)
      const role: UserRole = (userData.role as UserRole) || 'employee';

      if (role === 'owner') {
        const { data: stationsData } = await supabase
          .from('stations')
          .select('id, name, brand, address')
          .eq('owner_id', userData.id);
        stations = stationsData || [];
      } else if (role === 'employee') {
        const { data: userStationsData } = await supabase
          .from('user_stations')
          .select('stations ( id, name, brand, address )')
          .eq('user_id', userData.id);
        if (userStationsData) {
          stations = userStationsData.map((us: any) => us.stations).filter(Boolean);
        }
      } else if (role === 'superadmin') {
        const { data: stationsData } = await supabase
          .from('stations')
          .select('id, name, brand, address')
          .limit(5);
        stations = stationsData || [];
      }

      const transformedUser: User = {
        id: userData.id,
        name: userData.name ?? null,
        email: userData.email,
        phone: userData.phone ?? null,
        role,
        is_active: userData.is_active,
        created_at: userData.created_at ?? null,
        updated_at: userData.updated_at ?? null,
        stations,
      };

      setUser(transformedUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // First check if user exists in our system with email & is_active
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (userError || !userData) {
        throw new Error('Invalid credentials or account not found');
      }

      // Attempt sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed') || 
            signInError.message.includes('email_not_confirmed') ||
            signInError.message.includes('signup_disabled')) {
          throw new Error('Email not confirmed');
        }
        throw new Error('Invalid credentials');
      }
      // User data will be set by the auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
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
