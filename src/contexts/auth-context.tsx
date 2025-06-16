
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User, Subscription } from '@supabase/supabase-js';
import { AppSettingsProviderValue, useAppSettings } from './app-settings-context';

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
  setProfile: Dispatch<SetStateAction<Profile | null>>;
  appSettings: AppSettingsProviderValue;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null); // Renomeado para evitar conflito no setProfile
  const [isLoading, setIsLoading] = useState(true); // Inicia como true
  const appSettings = useAppSettings();

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      console.log("AuthContext: fetchProfile called with no userId.");
      return null;
    }
    try {
      console.log(`AuthContext: Fetching profile for user ID: ${userId}`);
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && status !== 406) {
        console.error('AuthContext: Error fetching profile:', error.message, {userId, status});
        return null;
      }
      if (data) {
        console.log(`AuthContext: Profile fetched successfully for user ID: ${userId}`);
        return data as Profile;
      }
      console.log(`AuthContext: No profile data found for user ID: ${userId} (status: ${status})`);
      return null;
    } catch (error: any) {
      console.error('AuthContext: Exception during fetchProfile:', error.message);
      return null;
    }
  }, []);

  const setProfile = useCallback((newProfile: Profile | null | ((prevState: Profile | null) => Profile | null)) => {
    setProfileState(newProfile);
  }, []);


  useEffect(() => {
    let isMounted = true;
    // Explicitamente definir isLoading como true no início do efeito, caso não seja o estado inicial.
    // Isso garante que estamos em estado de carregamento ao iniciar a verificação da sessão.
    if (!isLoading) setIsLoading(true);
    
    console.log("AuthContext: Main useEffect running to manage auth state.");

    const processAuthState = async (event: string | null, currentSession: AuthSession | null) => {
      if (!isMounted) {
        console.log(`AuthContext: processAuthState (${event || 'unknown'}) - component unmounted. Aborting.`);
        return;
      }
      console.log(`AuthContext: processAuthState. Event: ${event || 'initial_load'}, Session User: ${currentSession?.user?.id || 'null'}`);
      
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        console.log(`AuthContext: User ${currentUser.id} detected. Fetching profile...`);
        const userProfile = await fetchProfile(currentUser.id);
        if (isMounted) {
          setProfileState(userProfile);
          console.log(`AuthContext: Profile ${userProfile ? 'fetched/set' : 'not found/error'} for ${currentUser.id}.`);
        }
      } else {
        if (isMounted) setProfileState(null);
      }
      
      if (isMounted) {
        // Este é o ponto chave: isLoading só se torna false após toda a lógica de sessão/perfil ser processada.
        console.log("AuthContext: processAuthState finished. Setting isLoading to false.");
        setIsLoading(false);
      }
    };

    // Primeira verificação da sessão ao carregar o contexto
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        console.log("AuthContext: Initial supabase.auth.getSession() responded.");
        processAuthState('INITIAL_SESSION_CHECK', initialSession);
      })
      .catch(error => {
        console.error("AuthContext: Error in initial supabase.auth.getSession():", error);
        if (isMounted) {
          // Em caso de erro ao buscar a sessão inicial, assumimos que não há sessão.
          processAuthState('INITIAL_SESSION_ERROR', null);
        }
      });

    // Ouvinte para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log(`AuthContext: supabase.auth.onAuthStateChange listener fired. Event: ${_event}, Session User: ${currentSession?.user?.id || 'null'}`);
      // Apenas re-processa. `processAuthState` já lida com `isLoading`.
      // Não queremos definir isLoading=true para cada evento onAuthStateChange (ex: TOKEN_REFRESHED),
      // pois isso pode causar um piscar na UI se o usuário já estiver logado.
      // `isLoading` é principalmente para a carga inicial.
      await processAuthState(_event, currentSession);
    });

    return () => {
      console.log("AuthContext: Unmount effect running. Unsubscribing auth listener.");
      isMounted = false;
      subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]); // fetchProfile (com useCallback) é uma dependência estável.

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
