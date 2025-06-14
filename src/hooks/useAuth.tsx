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
  const [accountSetupPending, setAccountSetupPending] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name ?? session.user.email ?? null,
          email: session.user.email!,
          phone: session.user.user_metadata.phone ?? null,
          role: (session.user.user_metadata.role as UserRole) ?? 'employee',
          is_active: true,
          created_at: null,
          updated_at: null,
          stations: [],
        });
        retryFetchUserData(session.user.email!, 0);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name ?? session.user.email ?? null,
          email: session.user.email!,
          phone: session.user.user_metadata.phone ?? null,
          role: (session.user.user_metadata.role as UserRole) ?? 'employee',
          is_active: true,
          created_at: null,
          updated_at: null,
          stations: [],
        });
        retryFetchUserData(session.user.email!, 0);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const retryFetchUserData = async (email: string, attempt: number) => {
    setAccountSetupPending(attempt > 0);
    try {
      const success = await fetchUserData(email);
      if (!success && attempt < 5) {
        setTimeout(() => retryFetchUserData(email, attempt + 1), 3000);
      }
    } finally {
      setAccountSetupPending(false);
    }
  };

  const fetchUserData = async (email: string): Promise<boolean> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (userError || !userData) {
        setLoading(false);
        return false;
      }

      let stations = [];

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
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (
          signInError.message.includes('Email not confirmed') ||
          signInError.message.includes('email_not_confirmed') ||
          signInError.message.includes('signup_disabled')
        ) {
          throw new Error('Email not confirmed');
        }
        throw new Error('Invalid credentials');
      }
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

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      ) : accountSetupPending ? (
        <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
          <div className="text-lg font-semibold">Setting up your account…</div>
          <div className="text-gray-500">Please wait a moment while we finish your registration. This may take a few seconds.</div>
        </div>
      ) : (
        children
      )}
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
