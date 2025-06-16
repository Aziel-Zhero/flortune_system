
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User } from '@supabase/supabase-js';
import { AppSettingsProviderValue, useAppSettings } from './app-settings-context'; // Import AppSettings types if needed

// Definindo o tipo para os dados do perfil
export interface Profile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  rg: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  session: AuthSession | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setProfile: Dispatch<SetStateAction<Profile | null>>; // Para atualizar o perfil na UI
  appSettings: AppSettingsProviderValue; // Incluir configurações do app
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appSettings = useAppSettings(); // Obter as configurações do app

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) return null;
    try {
      console.log(`AuthContext: Fetching profile for user ID: ${userId}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('AuthContext: Error fetching profile:', error.message, {userId});
        throw error;
      }
      console.log(`AuthContext: Profile fetched successfully for user ID: ${userId}`, data);
      return data as Profile;
    } catch (error) {
      // Erro já logado
      return null;
    }
  }, []);

  useEffect(() => {
    console.log("AuthContext: useEffect for auth state changes is mounting/running.");
    setIsLoading(true);
    console.log("AuthContext: Initial isLoading set to true.");

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("AuthContext: Initial supabase.auth.getSession() completed. Session user ID:", currentSession?.user?.id || "null");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user.id);
        setProfile(userProfile);
      }
      setIsLoading(false);
      console.log("AuthContext: Initial load finished. isLoading set to false.");
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log(`AuthContext: onAuthStateChange triggered. Event: ${_event}, New session user ID: ${newSession?.user?.id || "null"}`);
        
        // Definir isLoading como true aqui pode causar um piscar da UI se a atualização for rápida.
        // É mais para indicar que uma mudança de estado está em progresso.
        // setIsLoading(true); 

        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const userProfile = await fetchProfile(newSession.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
          console.log("AuthContext: Session removed or became null, profile cleared.");
        }
        // Garante que isLoading seja false após o processamento do evento,
        // especialmente se o definimos como true no início deste callback.
        // Se não o fizemos, esta linha garante que se algo o definiu como true, ele volte a false.
        // setIsLoading(false); 
        // No momento, o principal isLoading é para a carga inicial.
        // Se a sessão mudou, o estado isLoading deve refletir que a "carga de autenticação" está completa.
        if (isLoading && (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || newSession !== session)) {
            // Se isLoading ainda era true (improvável aqui se o getSession inicial já rodou)
            // ou se a sessão realmente mudou, garantimos que isLoading se torne false.
            // No entanto, o getSession inicial já deve ter definido isLoading para false.
            // O mais importante é que `session` e `user` sejam atualizados.
        }
      }
    );

    return () => {
      console.log("AuthContext: useEffect for auth state changes is unmounting. Unsubscribing listener.");
      authListener?.unsubscribe();
    };
  }, [fetchProfile, session]); // Adicionado session à dependência para re-logar se necessário, embora onAuthStateChange deva cuidar disso.

  if (typeof window !== 'undefined') { // Log apenas no cliente
    console.log("AuthContext: Rendering AuthProvider. isLoading:", isLoading, "Session user ID:", session?.user?.id || "null", "User ID:", user?.id || "null");
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, setProfile, appSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
