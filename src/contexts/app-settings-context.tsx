
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
  currentTheme: string;
  setCurrentTheme: Dispatch<SetStateAction<string>>;
  applyTheme: (themeId: string) => void;
}

const AppSettingsContext = createContext<AppSettingsProviderValue | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');

  const applyTheme = useCallback((themeId: string) => {
    document.documentElement.className = ''; // Limpa todas as classes de tema
    if (themeId !== 'default') {
      document.documentElement.classList.add(themeId);
    }
    if (isDarkMode) { // Reaplicar a classe .dark se o modo escuro estiver ativo
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('flortune-theme', themeId);
    setCurrentTheme(themeId);
  }, [isDarkMode]);

  useEffect(() => {
    const storedPrivateMode = localStorage.getItem('flortune-private-mode');
    if (storedPrivateMode) {
      setIsPrivateMode(JSON.parse(storedPrivateMode));
    }

    const storedTheme = localStorage.getItem('flortune-theme') || 'default';
    applyTheme(storedTheme); // Aplica o tema ao carregar

    // Dark mode inicialização
    const storedDarkMode = localStorage.getItem('flortune-dark-mode');
    let darkModeEnabled = false;
    if (storedDarkMode !== null) {
      darkModeEnabled = JSON.parse(storedDarkMode);
    } else {
      // Se não houver preferência salva, verifica a preferência do sistema
      darkModeEnabled = typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDarkMode(darkModeEnabled);
    // A aplicação inicial da classe .dark é feita no applyTheme se isDarkMode for true
    // ou no useEffect abaixo que observa isDarkMode

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez na montagem

  useEffect(() => {
    localStorage.setItem('flortune-private-mode', JSON.stringify(isPrivateMode));
  }, [isPrivateMode]);

  const togglePrivateMode = useCallback(() => {
    setIsPrivateMode(prev => !prev);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('flortune-dark-mode', JSON.stringify(isDarkMode));
    // Reaplicar o tema atual para garantir que a classe .dark seja considerada
    applyTheme(currentTheme); 
  }, [isDarkMode, currentTheme, applyTheme]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);


  return (
    <AppSettingsContext.Provider value={{ 
      isPrivateMode, setIsPrivateMode, togglePrivateMode,
      isDarkMode, setIsDarkMode, toggleDarkMode,
      currentTheme, setCurrentTheme, applyTheme
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = (): AppSettingsProviderValue => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
