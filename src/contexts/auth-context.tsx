
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User } from '@supabase/supabase-js';
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
  isLoading: boolean; // Este isLoading reflete o estado de carregamento inicial da autenticação
  setProfile: Dispatch<SetStateAction<Profile | null>>;
  appSettings: AppSettingsProviderValue;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Começa true, só se torna false após a carga inicial
  const [mounted, setMounted] = useState(false);
  const appSettings = useAppSettings();

  useEffect(() => {
    setMounted(true);
    console.log("AuthContext: Mounting. isLoading is true.");
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

  useEffect(() => {
    if (!mounted) return;

    let isEffectMounted = true;
    console.log("AuthContext: Main effect running (mounted).");

    const performInitialAuthSetup = async () => {
      console.log("AuthContext: Starting initial supabase.auth.getSession()...");
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isEffectMounted) {
            console.log("AuthContext: Unmounted during initial getSession. Aborting.");
            return;
        }

        if (sessionError) {
          console.error("AuthContext: Error getting initial session:", sessionError.message);
        }
        console.log(`AuthContext: Initial supabase.auth.getSession() responded. Session User ID: ${initialSession?.user?.id || 'null'}`);
        
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await fetchProfile(currentUser.id);
          setProfileState(userProfile);
          console.log(`AuthContext: Profile ${userProfile ? 'fetched/set' : 'not found/set to null'} for ${currentUser.id} after initial getSession.`);
        } else {
          setProfileState(null);
          console.log("AuthContext: No current user after initial getSession. Profile set to null.");
        }
      } catch (e) {
         console.error("AuthContext: Exception during initial getSession or profile fetch:", e);
         if (isEffectMounted) {
            setSession(null);
            setUser(null);
            setProfileState(null);
         }
      } finally {
        if (isEffectMounted) {
          console.log("AuthContext: Initial session and profile check complete. Setting isLoading to false.");
          setIsLoading(false);
        }
      }
    };

    performInitialAuthSetup();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!isEffectMounted) {
            console.log("AuthContext: Unmounted during onAuthStateChange. Aborting.");
            return;
        }
        console.log(`AuthContext: supabase.auth.onAuthStateChange listener fired. Event: ${_event}, Session User ID: ${currentSession?.user?.id || 'null'}`);
        
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await fetchProfile(currentUser.id);
          setProfileState(userProfile);
          console.log(`AuthContext: Profile ${userProfile ? 'fetched/set' : 'not found/set to null'} for ${currentUser.id} from onAuthStateChange.`);
        } else {
          setProfileState(null);
          console.log("AuthContext: No current user from onAuthStateChange. Profile set to null.");
        }
        // IMPORTANTE: Não mudar isLoading aqui, ele é definido uma vez após a carga inicial.
      }
    );

    return () => {
      console.log("AuthContext: Unmounting. Unsubscribing auth listener.");
      isEffectMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [mounted, fetchProfile]);

  useEffect(() => {
    if (!mounted) return;
    // Log para depuração do estado final do contexto
    console.log(`AuthContext STATE UPDATE --- isLoading: ${isLoading}, User: ${user?.id || 'null'}, Profile: ${profile ? 'Loaded' : 'Null'}, Session: ${session ? 'Exists' : 'Null'}`);
  }, [mounted, isLoading, user, profile, session]);
  
  if (!mounted) {
    // Este log já existe no useEffect de montagem.
    // console.log("AuthContext: Not mounted yet, returning null to prevent hydration mismatch.");
    return null;
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

    