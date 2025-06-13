"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect } from 'react';

interface AppSettingsContextType {
  isPrivateMode: boolean;
  setIsPrivateMode: Dispatch<SetStateAction<boolean>>;
  togglePrivateMode: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);

  // Persist private mode setting to localStorage
  useEffect(() => {
    const storedPrivateMode = localStorage.getItem('flortune-private-mode');
    if (storedPrivateMode) {
      setIsPrivateMode(JSON.parse(storedPrivateMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('flortune-private-mode', JSON.stringify(isPrivateMode));
  }, [isPrivateMode]);

  const togglePrivateMode = () => {
    setIsPrivateMode(prev => !prev);
  };

  return (
    <AppSettingsContext.Provider value={{ isPrivateMode, setIsPrivateMode, togglePrivateMode }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
