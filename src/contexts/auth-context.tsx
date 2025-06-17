
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User } from '@supabase/supabase-js'; // Subscription não é mais usado diretamente aqui
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
  isLoading: boolean; // Será !initialLoadAttempted E !mounted
  setProfile: Dispatch<SetStateAction<Profile | null>>;
  appSettings: AppSettingsProviderValue;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [mounted, setMounted] = useState(false); // Novo estado para controle de montagem
  const appSettings = useAppSettings();

  useEffect(() => {
    setMounted(true); // Componente montado no cliente
  }, []);

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

  const handleAuthAndProfileState = useCallback(async (currentSession: AuthSession | null, eventName?: string) => {
    console.log(`AuthContext: handleAuthAndProfileState. Event: ${eventName || 'update'}, Session User ID: ${currentSession?.user?.id || 'null'}`);
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      console.log(`AuthContext: User ${currentUser.id} detected. Fetching profile...`);
      const userProfile = await fetchProfile(currentUser.id);
      setProfileState(userProfile);
      console.log(`AuthContext: Profile ${userProfile ? 'fetched/set' : 'not found/set to null'} for ${currentUser.id}.`);
    } else {
      setProfileState(null);
      console.log("AuthContext: No current user. Profile set to null.");
    }
  }, [fetchProfile]);

  useEffect(() => {
    if (!mounted) return; // Não fazer nada se não estiver montado no cliente

    let isEffectMounted = true;
    console.log("AuthContext: Mount effect running. initialLoadAttempted is false.");

    const performInitialAuthCheck = async () => {
      try {
        console.log("AuthContext: Starting initial supabase.auth.getSession()...");
        const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();

        if (!isEffectMounted) {
            console.log("AuthContext: Unmounted during initial getSession. Aborting.");
            return;
        }

        if (initialSessionError) {
          console.error("AuthContext: Error in initial supabase.auth.getSession():", initialSessionError);
        }
        
        console.log(`AuthContext: Initial supabase.auth.getSession() responded. Session User ID: ${initialSession?.user?.id || 'null'}`);
        await handleAuthAndProfileState(initialSession, 'INITIAL_SESSION_CHECK');

      } catch (error) {
        console.error("AuthContext: Exception during initial auth check:", error);
        if (isEffectMounted) {
            await handleAuthAndProfileState(null, 'INITIAL_SESSION_EXCEPTION');
        }
      } finally {
        if (isEffectMounted) {
          console.log("AuthContext: Initial auth check process finished. Setting initialLoadAttempted to true.");
          setInitialLoadAttempted(true);
        }
      }
    };

    performInitialAuthCheck();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isEffectMounted) {
        console.log("AuthContext: Unmounted during onAuthStateChange. Aborting.");
        return;
      }
      console.log(`AuthContext: supabase.auth.onAuthStateChange listener fired. Event: ${_event}, Session User ID: ${currentSession?.user?.id || 'null'}`);
      
      await handleAuthAndProfileState(currentSession, _event);

      if (!initialLoadAttempted && (currentSession || _event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'USER_DELETED')) {
          console.log(`AuthContext: onAuthStateChange ('${_event}') occurred during/completing initial load. Setting initialLoadAttempted to true.`);
          setInitialLoadAttempted(true);
      }
    });

    return () => {
      console.log("AuthContext: Unmount effect running. Unsubscribing auth listener.");
      isEffectMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [mounted, handleAuthAndProfileState]); // Adicionado mounted e handleAuthAndProfileState

  useEffect(() => {
     if (!mounted) return;
    console.log(`AuthContext STATE UPDATE --- isLoading: ${!initialLoadAttempted}, User: ${user?.id || 'null'}, Profile: ${profile ? 'Loaded' : 'Null'}, Session: ${session ? 'Exists' : 'Null'}`);
  }, [mounted, initialLoadAttempted, user, profile, session]);

  // Se não estiver montado no cliente, não renderize o provedor nem os children.
  if (!mounted) {
    console.log("AuthContext: Not mounted yet, returning null to prevent hydration mismatch.");
    return null;
  }

  // isLoading agora considera se a tentativa de carga inicial foi feita.
  const isLoadingValue = !initialLoadAttempted;

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading: isLoadingValue, setProfile, appSettings }}>
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
