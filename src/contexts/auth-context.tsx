// src/contexts/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database.types';

// O tipo User já inclui user_metadata, que usamos no cadastro
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
    
    // Inicia o carregamento para uma nova sessão
    setIsLoading(true);
    
    try {
      // 1. Pega o usuário da sessão do Supabase
      const authUser = currentSession.user;

      // 2. Busca o perfil correspondente na tabela 'profiles'
      const { data: profile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        console.error("AuthContext: Erro ao buscar perfil do usuário:", error.message);
        // Define a sessão mesmo que o perfil não seja encontrado, mas com perfil nulo
        const userWithNullProfile = { ...authUser, profile: null } as UserWithProfile;
        setSession({ ...currentSession, user: userWithNullProfile });
      } else {
        // 3. Junta o usuário da autenticação com o perfil do banco de dados
        const userWithProfile = { ...authUser, profile: profile || null } as UserWithProfile;
        setSession({ ...currentSession, user: userWithProfile });
      }
    } catch (e) {
      console.error("AuthContext: Exceção ao buscar perfil:", e);
      // Em caso de exceção, define a sessão com perfil nulo
      setSession({ ...currentSession, user: { ...currentSession.user, profile: null } as UserWithProfile });
    } finally {
      // Finaliza o carregamento após a tentativa de busca
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.error("AuthProvider: Cliente Supabase não inicializado.");
      setIsLoading(false);
      return;
    }
    
    // Busca a sessão inicial ao carregar o provedor
    const getInitialSession = async () => {
        const { data: { session: initialSupabaseSession } } = await supabase.auth.getSession();
        await fetchProfileAndSetSession(initialSupabaseSession);
    };

    getInitialSession();

    // Ouve mudanças no estado de autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSupabaseSession) => {
      await fetchProfileAndSetSession(newSupabaseSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndSetSession]);

  // Função para permitir atualizações manuais no estado da sessão (ex: atualizar nome de usuário no perfil)
  const updateSessionManually = async (newSessionData: Partial<Session>) => {
    setSession(prevSession => {
      if (!prevSession) return null;
      // Merge profundo para atualizar propriedades aninhadas como 'user' e 'profile'
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
