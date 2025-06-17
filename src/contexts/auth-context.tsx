
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
  isLoading: boolean; // Agora será !initialLoadComplete
  setProfile: Dispatch<SetStateAction<Profile | null>>;
  appSettings: AppSettingsProviderValue;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const appSettings = useAppSettings();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
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
        console.error('AuthContext: Error fetching profile:', error.message, { userId, status });
        return null;
      }
      if (data) {
        console.log(`AuthContext: Profile fetched successfully for user ID: ${userId}.`);
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

  // Função centralizada para lidar com mudanças de autenticação e perfil
  const handleAuthAndProfileState = useCallback(async (currentSession: AuthSession | null, eventName?: string) => {
    console.log(`AuthContext: handleAuthAndProfileState. Event: ${eventName || 'update'}, Session User ID: ${currentSession?.user?.id || 'null'}`);
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      console.log(`AuthContext: User ${currentUser.id} detected in handleAuthAndProfileState. Fetching profile...`);
      const userProfile = await fetchProfile(currentUser.id);
      setProfileState(userProfile);
      console.log(`AuthContext: Profile ${userProfile ? 'fetched/set' : 'not found/set to null'} for ${currentUser.id}.`);
    } else {
      setProfileState(null);
      console.log("AuthContext: No current user in handleAuthAndProfileState. Profile set to null.");
    }
  }, [fetchProfile]);


  useEffect(() => {
    let isMounted = true;
    console.log("AuthContext: Mount effect running. initialLoadComplete is false.");

    const performInitialAuthCheck = async () => {
      try {
        console.log("AuthContext: Starting initial supabase.auth.getSession()...");
        const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();

        if (!isMounted) {
            console.log("AuthContext: Unmounted during initial getSession. Aborting.");
            return;
        }

        if (initialSessionError) {
          console.error("AuthContext: Error in initial supabase.auth.getSession():", initialSessionError);
        }
        
        console.log(`AuthContext: Initial supabase.auth.getSession() responded. Session User ID: ${initialSession?.user?.id || 'null'}`);
        // Atualiza sessão, usuário e perfil com base na sessão inicial
        await handleAuthAndProfileState(initialSession, 'INITIAL_SESSION_CHECK');

      } catch (error) {
        console.error("AuthContext: Exception during initial auth check:", error);
        if (isMounted) {
            await handleAuthAndProfileState(null, 'INITIAL_SESSION_EXCEPTION');
        }
      } finally {
        if (isMounted) {
          console.log("AuthContext: Initial auth check process (getSession + fetchProfile if any) finished. Setting initialLoadComplete to true.");
          setInitialLoadComplete(true);
        }
      }
    };

    performInitialAuthCheck();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) {
        console.log("AuthContext: Unmounted during onAuthStateChange. Aborting.");
        return;
      }
      console.log(`AuthContext: supabase.auth.onAuthStateChange listener fired. Event: ${_event}, Session User ID: ${currentSession?.user?.id || 'null'}`);
      
      await handleAuthAndProfileState(currentSession, _event);

      // Se o listener for acionado e o carregamento inicial AINDA não estiver completo,
      // e agora temos uma sessão (ou um evento de SIGNED_IN claro),
      // isso pode significar que o listener completou a configuração inicial.
      // Também trata o caso de um SIGNED_OUT durante o carregamento inicial.
      if (!initialLoadComplete && (currentSession || _event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'USER_DELETED')) {
          console.log(`AuthContext: onAuthStateChange ('${_event}') occurred during/completing initial load. Setting initialLoadComplete to true.`);
          setInitialLoadComplete(true);
      }
    });

    return () => {
      console.log("AuthContext: Unmount effect running. Unsubscribing auth listener.");
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [handleAuthAndProfileState]); // fetchProfile foi movido para dentro de handleAuthAndProfileState

  useEffect(() => {
    // Este log é para cada vez que o estado relevante muda.
    // initialLoadComplete se torna true uma vez. isLoading (que é !initialLoadComplete) muda de true para false.
    console.log(`AuthContext STATE UPDATE --- isLoading: ${!initialLoadComplete}, User: ${user?.id || 'null'}, Profile: ${profile ? 'Loaded' : 'Null'}, Session: ${session ? 'Exists' : 'Null'}`);
  }, [initialLoadComplete, user, profile, session]);

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading: !initialLoadComplete, setProfile, appSettings }}>
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
