
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserData(session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
        setUser(null);
        setLoading(false);
        return;
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
        // For superadmin, get all stations (limited for demo)
        const { data: stationsData, error: stationsError } = await supabase
          .from('stations')
          .select('id, name, brand, address')
          .limit(5);

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

      setUser(transformedUser);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      // First check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        throw new Error('Invalid credentials or account not found');
      }

      // For demo purposes, we'll accept the passwords from the seed data
      // In production, you'd verify the password hash
      const validCredentials = [
        { email: 'admin@fuelsync.com', password: 'admin123' },
        { email: 'rajesh@fuelsync.com', password: 'owner123' },
        { email: 'ravi@fuelsync.com', password: 'emp123' }
      ];

      const validUser = validCredentials.find(
        cred => cred.email === email && cred.password === password
      );

      if (!validUser) {
        throw new Error('Invalid credentials');
      }

      // Create a Supabase auth session using signInWithPassword
      // For demo, we'll use the email as both email and password for Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: userData.role,
            user_id: userData.id
          }
        }
      });

      // If user already exists, try signing in
      if (authError?.message?.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInError) {
          throw new Error('Authentication failed');
        }
      } else if (authError) {
        throw new Error('Authentication failed');
      }

      // fetchUserData will be called automatically by the auth state change listener
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      throw error;
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

  const signOut = logout;

  const value = {
    user,
    session,
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
