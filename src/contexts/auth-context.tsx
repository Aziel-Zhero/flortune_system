
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
  const [isLoading, setIsLoading] = useState(true);
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
      if (error && status !== 406) { // 406 means no rows found, which is not an "error" if profile doesn't exist yet
        console.error('AuthContext: Error fetching profile:', error.message, {userId, status});
        throw error;
      }
      if (data) {
        console.log(`AuthContext: Profile fetched successfully for user ID: ${userId}`, data);
        return data as Profile;
      }
      console.log(`AuthContext: No profile data found for user ID: ${userId} (status: ${status})`);
      return null;
    } catch (error) {
      // Log to browser console for client-side issues
      console.error('AuthContext: Exception during fetchProfile:', error);
      return null; // Return null on error to prevent crashes
    }
  }, []);

  useEffect(() => {
    console.log("AuthContext: Mount effect running.");
    setIsLoading(true);
    let isMounted = true;

    const handleAuthChange = async (currentSession: AuthSession | null, eventType?: string) => {
      if (!isMounted) return;
      
      console.log(`AuthContext: handleAuthChange called (event: ${eventType || 'initial_load'}). Session user ID:`, currentSession?.user?.id || "null");
      
      // Set loading true at the start of handling an auth change if not initial load
      // if (eventType !== 'initial_load' && eventType !== 'INITIAL_SESSION') {
      //   setIsLoading(true);
      // }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        try {
          const userProfile = await fetchProfile(currentSession.user.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        } catch (e) {
          // Error already logged in fetchProfile
          if (isMounted) {
            setProfile(null); // Ensure profile is null if fetch fails
          }
        }
      } else {
        if (isMounted) {
          setProfile(null);
        }
      }
      
      if (isMounted) {
        setIsLoading(false); // Always set loading to false after processing
        console.log("AuthContext: handleAuthChange finished, isLoading set to false.");
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("AuthContext: Initial getSession responded.");
      if (isMounted) {
        handleAuthChange(initialSession, 'INITIAL_SESSION');
      }
    }).catch(error => {
        console.error("AuthContext: Error in initial getSession:", error);
        if(isMounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            setIsLoading(false); // Ensure loading is false even on error
        }
    });

    // Listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log(`AuthContext: onAuthStateChange triggered. Event: ${_event}, New session user ID: ${newSession?.user?.id || "null"}`);
        if (isMounted) {
          // setIsLoading(true); // Optionally set loading true during transitions
          await handleAuthChange(newSession, _event);
        }
      }
    );

    return () => {
      console.log("AuthContext: Unmount effect running. Unsubscribing listener.");
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, [fetchProfile]); // fetchProfile is memoized with useCallback

  if (typeof window !== 'undefined') {
    console.log("AuthContext: Rendering. isLoading:", isLoading, "Session user:", session?.user?.id || "null", "User object:", user?.id || "null");
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
