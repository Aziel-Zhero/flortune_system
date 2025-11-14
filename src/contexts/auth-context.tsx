// src/contexts/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database.types';

// Estendemos o tipo User do Supabase para incluir nosso perfil
type UserWithProfile = User & { profile: Profile | null };

// A sessão agora pode conter o usuário com perfil
export type Session = Omit<AuthSession, 'user'> & {
  user: UserWithProfile | null;
};

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
        console.warn("Supabase client not initialized. AuthProvider cannot function.");
        setIsLoading(false);
        return;
    };
    
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
            const userWithNullProfile = { ...currentSession.user, profile: null } as UserWithProfile;
            setSession({ ...currentSession, user: userWithNullProfile });
        } else {
             const userWithProfile = { ...currentSession.user, profile } as UserWithProfile;
             setSession({ ...currentSession, user: userWithProfile });
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
          const userWithProfile = { ...session.user, profile } as UserWithProfile;
          setSession({ ...session, user: userWithProfile });
      } else {
          setSession(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // A dependência do supabase foi removida pois ele é um singleton agora

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useSession = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSession must be used within an AuthProvider.');
  }
  return context;
};
