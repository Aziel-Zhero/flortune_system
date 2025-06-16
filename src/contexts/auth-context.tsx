
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
  isLoading: boolean;
  setProfile: Dispatch<SetStateAction<Profile | null>>;
  appSettings: AppSettingsProviderValue;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true
  const appSettings = useAppSettings();

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) return null;
    try {
      console.log(`AuthContext: Fetching profile for user ID: ${userId}`);
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && status !== 406) {
        console.error('AuthContext: Error fetching profile:', error.message, {userId, status});
        // Do not throw here, let processAuthSession handle errors and loading state
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
    console.log("AuthContext: Mount effect running.");
    let isMounted = true;
    // Ensure isLoading is true at the very start of the effect,
    // if it wasn't already set by the initial state.
    if (isMounted && !isLoading) setIsLoading(true);

    // Function to handle auth state changes and profile fetching
    const processAuthSession = async (currentSession: AuthSession | null, eventType?: string) => {
      if (!isMounted) return;

      console.log(`AuthContext: processAuthSession (event: ${eventType || 'initial_load'}). Session user ID:`, currentSession?.user?.id || "null");

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user.id);
        if (isMounted) setProfile(userProfile); // userProfile can be null if fetch fails or no profile
      } else {
        if (isMounted) setProfile(null);
      }
      
      // Set isLoading to false only after all processing for this auth state is done
      if (isMounted) {
        setIsLoading(false);
        console.log("AuthContext: processAuthSession finished, isLoading set to false for this event.");
      }
    };

    // Initial session check
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
            setIsLoading(false); // Crucial: set isLoading false even on error
        }
    });

    // Listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log(`AuthContext: onAuthStateChange triggered. Event: ${_event}, New session user ID: ${newSession?.user?.id || "null"}`);
        if (isMounted) {
          // When onAuthStateChange fires, we might be transitioning state,
          // so briefly set isLoading true if not already true,
          // to ensure AppLayout waits for profile etc.
          // However, if it's a sign out and session becomes null, isLoading might not need to be true.
          // For simplicity and robustness, let processAuthSession handle the final setIsLoading(false).
          // If you see flashes, you might re-introduce setIsLoading(true) here conditionally.
          await processAuthSession(newSession, _event);
        }
      }
    );

    return () => {
      console.log("AuthContext: Unmount effect running. Unsubscribing listener.");
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, [fetchProfile, isLoading]); // Added isLoading to dependencies to re-evaluate if it's externally changed, though unlikely.

  if (typeof window !== 'undefined') {
    // This log helps track rendering cycles and current state
    // console.log("AuthContext: Rendering. isLoading:", isLoading, "Session user:", session?.user?.id || "null", "User object:", user?.id || "null");
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
