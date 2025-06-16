
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
  const [profile, setProfileState] = useState<Profile | null>(null);
  // Initialize isLoading to true. It will be set to false once the initial auth check is complete.
  const [isLoading, setIsLoading] = useState(true);
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
      if (error && status !== 406) { // 406 means no rows found, which is not an "error" in this context if profile doesn't exist yet
        console.error('AuthContext: Error fetching profile:', error.message, {userId, status});
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
    let isMounted = true;
    // isLoading is already true by default
    console.log("AuthContext: Main useEffect running. isLoading is initially true.");

    const processAuthAndProfile = async (currentSession: AuthSession | null, eventName?: string) => {
      if (!isMounted) {
        console.log(`AuthContext: processAuthAndProfile (${eventName || 'unknown'}) - component unmounted. Aborting.`);
        return;
      }
      console.log(`AuthContext: processAuthAndProfile. Event: ${eventName || 'initial_load'}, Session User ID: ${currentSession?.user?.id || 'null'}`);

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        console.log(`AuthContext: User ${currentUser.id} detected. Fetching profile...`);
        const userProfile = await fetchProfile(currentUser.id);
        if (isMounted) {
          setProfileState(userProfile);
          console.log(`AuthContext: Profile ${userProfile ? 'fetched/set' : 'not found/set to null'} for ${currentUser.id}.`);
        }
      } else {
        if (isMounted) {
          setProfileState(null);
          console.log("AuthContext: No current user. Profile set to null.");
        }
      }
      
      // This is the critical point: set isLoading to false only after all processing for this auth state is done.
      if (isMounted) {
        console.log(`AuthContext: processAuthAndProfile for ${eventName || 'initial_load'} finished. Setting isLoading to false.`);
        setIsLoading(false);
      }
    };

    // Initial session check
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        console.log(`AuthContext: Initial supabase.auth.getSession() responded. Session User ID: ${initialSession?.user?.id || 'null'}`);
        if(isMounted) {
          processAuthAndProfile(initialSession, 'INITIAL_SESSION_CHECK');
        } else {
           console.log("AuthContext: Component unmounted before initial session could be processed.");
        }
      })
      .catch(error => {
        console.error("AuthContext: Error in initial supabase.auth.getSession():", error);
        if (isMounted) {
          processAuthAndProfile(null, 'INITIAL_SESSION_ERROR'); // Treat error as no session, then set isLoading false
        }
      });

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log(`AuthContext: supabase.auth.onAuthStateChange listener fired. Event: ${_event}, Session User ID: ${currentSession?.user?.id || 'null'}`);
      if(isMounted) {
        // If isLoading is still true, it means the initial getSession() hasn't finished processing yet.
        // In this case, onAuthStateChange (e.g., for SIGNED_IN) might complete the initial setup.
        // If isLoading is already false, this is a subsequent change (like TOKEN_REFRESHED or SIGNED_OUT).
        // We don't want to set isLoading back to true for these subsequent events.
        const wasLoading = isLoading;
        await processAuthAndProfile(currentSession, _event);
        if (wasLoading && !isLoading) {
          console.log(`AuthContext: onAuthStateChange event '${_event}' was responsible for setting isLoading to false.`);
        }
      }
    });

    return () => {
      console.log("AuthContext: Unmount effect running. Unsubscribing auth listener.");
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile, isLoading]); // isLoading is included to re-evaluate if `processAuthAndProfile` needs to run if an external factor changes it, though unlikely with this setup.

  useEffect(() => {
    console.log(`AuthContext STATE UPDATE --- isLoading: ${isLoading}, User: ${user?.id || 'null'}, Profile: ${profile ? 'Loaded' : 'Null'}`);
  }, [isLoading, user, profile, session]);

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
