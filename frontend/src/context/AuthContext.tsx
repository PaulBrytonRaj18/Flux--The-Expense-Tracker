import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; requiresConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const configured = supabase !== null;

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    supabase!.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session fetch error:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signUp = async (email: string, password: string) => {
    if (!configured) return { error: new Error('Supabase not configured') as Error, requiresConfirmation: false };
    const { data, error } = await supabase!.auth.signUp({ email, password });
    const requiresConfirmation = !!data?.user && !data.session;
    return { error, requiresConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    if (!configured) return { error: new Error('Supabase not configured') as Error };
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (!configured) return;
    await supabase!.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, configured, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
