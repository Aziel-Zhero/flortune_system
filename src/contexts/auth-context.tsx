// src/contexts/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthSession } from '@supabase/supabase-js';
import type { Profile } from '@/types/database.types';

type Session = AuthSession & {
  user: {
    profile: Profile | null;
  }
};

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        setSession(null);
        setIsLoading(false);
        return;
      }
      
      if (currentSession) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
            console.error("Error fetching profile on session load:", profileError.message);
            // We still set the session, but profile will be null
             setSession({ ...currentSession, user: { ...currentSession.user, profile: null } });
        } else {
             setSession({ ...currentSession, user: { ...currentSession.user, profile } });
        }
      } else {
        setSession(null);
      }
      setIsLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setSession({ ...session, user: { ...session.user, profile } });
      } else {
          setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSession must be used within an AuthProvider.');
  }
  // Renomeando para evitar conflito com a session interna
  const { session: currentSession, isLoading: isSessionLoading } = context;
  return { session: currentSession, isLoading: isSessionLoading };
};
