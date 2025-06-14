
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

interface AppSettingsContextType {
  isPrivateMode: boolean;
  setIsPrivateMode: Dispatch<SetStateAction<boolean>>;
  togglePrivateMode: () => void;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  toggleDarkMode: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize private mode from localStorage
  useEffect(() => {
    const storedPrivateMode = localStorage.getItem('flortune-private-mode');
    if (storedPrivateMode) {
      setIsPrivateMode(JSON.parse(storedPrivateMode));
    }
  }, []);

  // Persist private mode to localStorage
  useEffect(() => {
    localStorage.setItem('flortune-private-mode', JSON.stringify(isPrivateMode));
  }, [isPrivateMode]);

  const togglePrivateMode = useCallback(() => {
    setIsPrivateMode(prev => !prev);
  }, []);

  // Initialize dark mode from localStorage or system preference
   useEffect(() => {
    const storedDarkMode = localStorage.getItem('flortune-dark-mode');
    let darkModeEnabled = false;
    if (storedDarkMode !== null) {
      darkModeEnabled = JSON.parse(storedDarkMode);
    } else {
      // Fallback: check if the class is already on the html element or system preference
      darkModeEnabled = document.documentElement.classList.contains('dark') || 
                        (typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    setIsDarkMode(darkModeEnabled);
    // Ensure HTML class matches this initial state
    if (darkModeEnabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Apply dark mode class to <html> and persist to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('flortune-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);


  return (
    <AppSettingsContext.Provider value={{ 
      isPrivateMode, setIsPrivateMode, togglePrivateMode,
      isDarkMode, setIsDarkMode, toggleDarkMode
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

// Keep existing hook export for use-app-settings.ts
export const useAppSettingsContextHook = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettingsContextHook must be used within an AppSettingsProvider');
  }
  return context;
};
