
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Definindo o tipo para o valor do contexto de AppSettings
export interface AppSettingsProviderValue {
  isPrivateMode: boolean;
  setIsPrivateMode: Dispatch<SetStateAction<boolean>>;
  togglePrivateMode: () => void;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  toggleDarkMode: () => void;
}

const AppSettingsContext = createContext<AppSettingsProviderValue | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedPrivateMode = localStorage.getItem('flortune-private-mode');
    if (storedPrivateMode) {
      setIsPrivateMode(JSON.parse(storedPrivateMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('flortune-private-mode', JSON.stringify(isPrivateMode));
  }, [isPrivateMode]);

  const togglePrivateMode = useCallback(() => {
    setIsPrivateMode(prev => !prev);
  }, []);

   useEffect(() => {
    const storedDarkMode = localStorage.getItem('flortune-dark-mode');
    let darkModeEnabled = false;
    if (storedDarkMode !== null) {
      darkModeEnabled = JSON.parse(storedDarkMode);
    } else {
      darkModeEnabled = document.documentElement.classList.contains('dark') || 
                        (typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    setIsDarkMode(darkModeEnabled);
    if (darkModeEnabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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

// Renomeado o hook exportado para evitar conflito de nome e manter a consistência
export const useAppSettings = (): AppSettingsProviderValue => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
