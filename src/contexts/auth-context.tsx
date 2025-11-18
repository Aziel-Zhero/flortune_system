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

  const fetchSessionData = useCallback(async (currentSession: AuthSession | null): Promise<Session | null> => {
    if (!currentSession) {
      return null;
    }
    
    try {
      const { data: profile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error fetching profile:", error.message);
        const userWithNullProfile = { ...currentSession.user, profile: null } as UserWithProfile;
        return { ...currentSession, user: userWithNullProfile };
      }
      
      const userWithProfile = { ...currentSession.user, profile: profile || null } as UserWithProfile;
      return { ...currentSession, user: userWithProfile };
    } catch (e) {
      console.error("Exception fetching profile:", e);
      return { ...currentSession, user: { ...currentSession.user, profile: null } as UserWithProfile };
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase client not initialized. AuthProvider cannot function.");
      setIsLoading(false);
      return;
    }
    
    const initializeSession = async () => {
      setIsLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const fullSession = await fetchSessionData(currentSession);
      setSession(fullSession);
      setIsLoading(false);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSupabaseSession) => {
      const fullSession = await fetchSessionData(newSupabaseSession);
      setSession(fullSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchSessionData]);

  const updateSessionManually = async (newSessionData: Partial<Session>) => {
    setSession(prevSession => {
      if (!prevSession) return null;
      // This is a shallow merge. For nested objects like 'user', you might need a deep merge
      return { ...prevSession, ...newSessionData };
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
    throw new Error('useSession must be used within an AuthProvider.');
  }
  return context;
};
