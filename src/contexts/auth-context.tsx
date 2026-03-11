
// src/contexts/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database.types';

type UserWithProfile = User & { profile: Profile | null };

export type Session = Omit<AuthSession, 'user'> & {
  user: UserWithProfile | null;
};

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  update: (newSessionData: Partial<Session>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndSetSession = useCallback(async (currentSession: AuthSession | null): Promise<void> => {
    if (!supabase) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    if (!currentSession?.user) {
      setSession(null);
      setIsLoading(false);
      return;
    }
    
    try {
      const authUser = currentSession.user;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      const userWithProfile = { ...authUser, profile: profile || null } as UserWithProfile;
      setSession({ ...currentSession, user: userWithProfile });
    } catch (e: any) {
      console.error("AuthContext Error:", e.message);
      if (currentSession.user) {
        setSession({ ...currentSession, user: { ...currentSession.user, profile: null } as UserWithProfile });
      } else {
        setSession(currentSession as Session);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      try {
        const { data: { session: initialSupabaseSession } } = await supabase.auth.getSession();
        await fetchProfileAndSetSession(initialSupabaseSession);
      } catch (error) {
        console.error("AuthContext Initial Error:", error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSupabaseSession) => {
      await fetchProfileAndSetSession(newSupabaseSession);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchProfileAndSetSession]);

  const updateSessionManually = async (newSessionData: Partial<Session>) => {
    setSession(prevSession => {
      if (!prevSession || !prevSession.user) return null;
      return {
        ...prevSession,
        ...newSessionData,
        user: newSessionData.user ? { ...prevSession.user, ...newSessionData.user } : prevSession.user
      };
    });
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, update: updateSessionManually }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useSession = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSession deve ser usado dentro de um AuthProvider.');
  }
  return context;
};
