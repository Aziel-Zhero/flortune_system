
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
      console.error('AuthContext: Service error fetching profile during callback processing:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    console.log("AuthContext: Mount effect running.");
    setIsLoading(true); 
    let isMounted = true;

    const handleAuthChange = async (currentSession: AuthSession | null, eventType?: string) => {
      if (!isMounted) return;

      console.log(`AuthContext: handleAuthChange called (event: ${eventType || 'initial load'}). Session user ID:`, currentSession?.user?.id || "null");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user.id);
        if (isMounted) {
          setProfile(userProfile);
        }
      } else {
        if (isMounted) {
          setProfile(null);
        }
      }
      if (isMounted) {
        setIsLoading(false);
        console.log("AuthContext: handleAuthChange finished, isLoading set to false.");
      }
    };

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("AuthContext: Initial getSession responded.");
      handleAuthChange(initialSession, 'initial getSession');
    }).catch(error => {
        console.error("AuthContext: Error in initial getSession:", error);
        if(isMounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            setIsLoading(false);
        }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log(`AuthContext: onAuthStateChange triggered. Event: ${_event}, New session user ID: ${newSession?.user?.id || "null"}`);
        // Potentially set isLoading true here if you want to show loading state during transitions
        // For now, handleAuthChange will set it to false once processing is done.
        // if (isMounted) setIsLoading(true); // Example if you want loading during transitions
        handleAuthChange(newSession, _event);
      }
    );

    return () => {
      console.log("AuthContext: Unmount effect running. Unsubscribing listener.");
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, [fetchProfile]);

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
