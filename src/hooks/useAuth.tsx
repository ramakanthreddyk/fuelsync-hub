
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch user details from our users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check against our users table with proper authentication
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        return { error: 'Invalid credentials' };
      }

      // Simple password check for demo (in real app, use proper authentication)
      const validCredentials = [
        { email: 'admin@fuelsync.com', password: 'admin123' },
        { email: 'rajesh@fuelsync.com', password: 'owner123' },
        { email: 'priya@fuelsync.com', password: 'owner123' },
        { email: 'amit@fuelsync.com', password: 'owner123' },
        { email: 'ravi@rajeshfuel.com', password: 'emp123' },
        { email: 'sunita@rajeshfuel.com', password: 'emp123' },
        { email: 'mohan@highway.com', password: 'emp123' },
        { email: 'kiran@priyapetrol.com', password: 'emp123' },
        { email: 'deepak@citycenter.com', password: 'emp123' }
      ];

      const isValid = validCredentials.some(cred => cred.email === email && cred.password === password);
      
      if (isValid) {
        setUser(userData);
        return {};
      }

      return { error: 'Invalid credentials' };
    } catch (error) {
      return { error: 'Authentication failed' };
    }
  };

  const signOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
