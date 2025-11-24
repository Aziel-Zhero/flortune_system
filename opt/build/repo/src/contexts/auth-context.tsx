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
    if (!currentSession?.user) {
      setSession(null);
      setIsLoading(false);
      return;
    }
    
    // Inicia o carregamento apenas se a sessão for nova ou diferente
    if (session?.user?.id !== currentSession.user.id) {
        setIsLoading(true);
    }
    
    try {
      const authUser = currentSession.user;
      const { data: profile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("AuthContext: Erro ao buscar perfil:", error.message);
        const userWithNullProfile = { ...authUser, profile: null } as UserWithProfile;
        setSession({ ...currentSession, user: userWithNullProfile });
      } else {
        const userWithProfile = { ...authUser, profile: profile || null } as UserWithProfile;
        setSession({ ...currentSession, user: userWithProfile });
      }
    } catch (e) {
      console.error("AuthContext: Exceção ao buscar perfil:", e);
      setSession({ ...currentSession, user: { ...currentSession.user, profile: null } as UserWithProfile });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]); // Depende do ID do usuário da sessão atual para evitar re-fetches desnecessários

  useEffect(() => {
    if (!supabase) {
      console.error("AuthProvider: Cliente Supabase não inicializado.");
      setIsLoading(false);
      return;
    }
    
    const getInitialSession = async () => {
        const { data: { session: initialSupabaseSession } } = await supabase.auth.getSession();
        await fetchProfileAndSetSession(initialSupabaseSession);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSupabaseSession) => {
      await fetchProfileAndSetSession(newSupabaseSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndSetSession]);

  const updateSessionManually = async (newSessionData: Partial<Session>) => {
    setSession(prevSession => {
      if (!prevSession) return null;
      return {
        ...prevSession,
        ...newSessionData,
        user: newSessionData.user 
          ? { ...prevSession.user, ...newSessionData.user } as UserWithProfile
          : prevSession.user
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
