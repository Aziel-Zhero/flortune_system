
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User, Subscription } from '@supabase/supabase-js'; // Added Subscription type
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    console.log("AuthContext: Main useEffect running. Initial isLoading:", isLoading);
    let isMounted = true;
    let authSubscription: Subscription | null = null;

    const processAuthSession = async (currentSession: AuthSession | null, eventType?: string) => {
      if (!isMounted) {
        console.log("AuthContext: processAuthSession called but component unmounted. Aborting.");
        return;
      }

      console.log(`AuthContext: processAuthSession (event: ${eventType || 'initial_load'}). Session user ID:`, currentSession?.user?.id || "null");
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user.id);
        if (isMounted) setProfile(userProfile);
      } else {
        if (isMounted) setProfile(null);
      }
      
      if (isMounted) {
        setIsLoading(false);
        console.log("AuthContext: processAuthSession finished, isLoading set to false.");
      }
    };

    // Ensure isLoading is true only at the very start if it's not already.
    // If it's already true from initial state, this won't change it.
    if(isMounted && !isLoading) {
        console.log("AuthContext: Setting isLoading to true at start of useEffect (was false).");
        setIsLoading(true);
    }


    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("AuthContext: Initial getSession responded.");
      if (isMounted) {
        processAuthSession(initialSession, 'INITIAL_SESSION');
      }
    }).catch(error => {
        console.error("AuthContext: Error in initial getSession:", error);
        if(isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsLoading(false);
            console.log("AuthContext: isLoading set to false after initial getSession error.");
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        authSubscription = subscription; // Store the subscription object
        console.log(`AuthContext: onAuthStateChange triggered. Event: ${_event}, New session user ID: ${newSession?.user?.id || "null"}`);
        if (isMounted) {
          // It's important that setIsLoading is true before processAuthSession
          // if we are transitioning states, to allow AppLayout to show loading.
          // However, processAuthSession will set it to false.
          // If _event is SIGNED_OUT, we might not want to show a long loading.
          if (!isLoading && _event !== 'SIGNED_OUT' && _event !== 'USER_DELETED') {
             console.log("AuthContext: onAuthStateChange - setting isLoading to true before processing.");
             setIsLoading(true);
          }
          await processAuthSession(newSession, _event);
        }
      }
    );
    
    // Assign the subscription to authSubscription immediately after it's created
    // This handles the case where the component unmounts before onAuthStateChange callback is ever fired
    if (subscription && !authSubscription) {
        authSubscription = subscription;
    }


    return () => {
      console.log("AuthContext: Unmount effect running. Unsubscribing listener.");
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]); // Removed isLoading from dependency array to prevent re-triggering on its own change

  if (typeof window !== 'undefined') {
    // console.log("AuthContext: Rendering. isLoading:", isLoading, "Session user:", session?.user?.id || "null");
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

