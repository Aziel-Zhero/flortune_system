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
    
    if (session?.user?.id !== currentSession.user.id) {
        setIsLoading(true);
    }
    
    try {
      if (!supabase) {
        console.error("AuthContext: Supabase client is not initialized.");
        setSession(null);
        setIsLoading(false);
        return;
      }
      
      const authUser = currentSession.user;
      const { data: profile, error } = await supabase
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
    } catch (e: any) {
      console.error("AuthContext: Exceção ao buscar perfil:", e.message);
      if (currentSession.user) {
        setSession({ ...currentSession, user: { ...currentSession.user, profile: null } as UserWithProfile });
      } else {
        setSession(currentSession as Session);
      }
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!supabase) {
      console.error("AuthProvider: Cliente Supabase não inicializado.");
      setIsLoading(false);
      return;
    }
    
    const getInitialSession = async () => {
      try {
        // Verificação adicional para garantir que supabase não é null
        if (!supabase?.auth) {
          console.error("AuthProvider: Supabase auth não disponível.");
          setIsLoading(false);
          return;
        }
        
        const { data: { session: initialSupabaseSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("AuthProvider: Erro ao obter sessão:", error.message);
          setIsLoading(false);
          return;
        }
        
        await fetchProfileAndSetSession(initialSupabaseSession);
      } catch (error) {
        console.error("AuthProvider: Exceção ao obter sessão inicial:", error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Verificar se supabase.auth.onAuthStateChange existe
    const authSubscription = supabase.auth.onAuthStateChange(async (_event, newSupabaseSession) => {
      await fetchProfileAndSetSession(newSupabaseSession);
    });

    return () => {
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [fetchProfileAndSetSession]);

  const updateSessionManually = async (newSessionData: Partial<Session>) => {
    setSession(prevSession => {
      if (!prevSession || !prevSession.user) return null;
      
      const updatedUser = newSessionData.user 
          ? { ...prevSession.user, ...newSessionData.user } 
          : prevSession.user;

      return {
        ...prevSession,
        ...newSessionData,
        user: updatedUser
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