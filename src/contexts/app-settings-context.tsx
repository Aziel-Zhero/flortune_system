
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { getQuotes, type QuoteData } from '@/services/quote.service';

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
  
  showQuotes: boolean;
  setShowQuotes: Dispatch<SetStateAction<boolean>>;
  selectedQuotes: string[];
  setSelectedQuotes: (quotes: string[]) => void;
  quotes: QuoteData[];
  isLoadingQuotes: boolean;
  quotesError: string | null;
  loadQuotes: (quoteList: string[]) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsProviderValue | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  
  const [showQuotes, setShowQuotes] = useState(true);
  const [selectedQuotes, setSelectedQuotesState] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  const loadQuotes = useCallback(async (quoteList: string[]) => {
    const validQuotes = quoteList.filter(q => q && q !== '');
    if (!showQuotes || validQuotes.length === 0) {
      setQuotes([]);
      setIsLoadingQuotes(false);
      return;
    }
    setIsLoadingQuotes(true);
    setQuotesError(null);
    try {
      const result = await getQuotes(validQuotes);
      if (result.error) throw new Error(result.error);
      setQuotes(result.data || []);
    } catch (err: any) {
      setQuotesError(err.message);
      setQuotes([]);
      toast({
        title: "Erro ao Carregar Cotações",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setIsLoadingQuotes(false);
    }
  }, [showQuotes]);

  const setSelectedQuotes = (newQuotes: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flortune-selected-quotes', JSON.stringify(newQuotes));
    }
    setSelectedQuotesState(newQuotes);
  };

  const applyTheme = useCallback((themeId: string) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove(...Array.from(root.classList).filter(cls => cls.startsWith('theme-')));
    
    if (themeId !== 'default') {
      root.classList.add(themeId);
    }
    localStorage.setItem('flortune-theme', themeId);
    setCurrentTheme(themeId);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newIsDark = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('flortune-dark-mode', JSON.stringify(newIsDark));
        document.documentElement.classList.toggle('dark', newIsDark);
      }
      return newIsDark;
    });
  }, []);
  
  const togglePrivateMode = useCallback(() => {
    setIsPrivateMode(prev => {
        const newMode = !prev;
        if (typeof window !== 'undefined') {
          localStorage.setItem('flortune-private-mode', JSON.stringify(newMode));
        }
        return newMode;
    });
  }, []);

  // Effect to load settings from localStorage on client-side mount
  useEffect(() => {
    try {
      const storedPrivateMode = localStorage.getItem('flortune-private-mode');
      if (storedPrivateMode) setIsPrivateMode(JSON.parse(storedPrivateMode));

      const storedDarkMode = localStorage.getItem('flortune-dark-mode');
      const darkModeEnabled = storedDarkMode ? JSON.parse(storedDarkMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(darkModeEnabled);
      document.documentElement.classList.toggle('dark', darkModeEnabled);
      
      const storedTheme = localStorage.getItem('flortune-theme') || 'default';
      applyTheme(storedTheme);

      const storedShowQuotes = localStorage.getItem('flortune-show-quotes');
      const show = storedShowQuotes ? JSON.parse(storedShowQuotes) : true;
      setShowQuotes(show);
      
      const storedQuotes = localStorage.getItem('flortune-selected-quotes');
      const quotesToLoad = storedQuotes ? JSON.parse(storedQuotes) : ['USD-BRL', 'EUR-BRL', 'BTC-BRL'];
      setSelectedQuotesState(quotesToLoad);
      if (show) {
        loadQuotes(quotesToLoad);
      } else {
        setIsLoadingQuotes(false);
      }
    } catch (error) {
        console.error("Failed to access localStorage or parse settings:", error);
        setIsLoadingQuotes(false);
    }
  }, [applyTheme, loadQuotes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flortune-show-quotes', JSON.stringify(showQuotes));
      if (showQuotes) {
        loadQuotes(selectedQuotes);
      } else {
        setQuotes([]);
      }
    }
  }, [showQuotes, selectedQuotes, loadQuotes]);

  return (
    <AppSettingsContext.Provider value={{ 
      isPrivateMode, setIsPrivateMode, togglePrivateMode,
      isDarkMode, setIsDarkMode, toggleDarkMode,
      currentTheme, setCurrentTheme, applyTheme,
      showQuotes, setShowQuotes, selectedQuotes, setSelectedQuotes, quotes, isLoadingQuotes, quotesError,
      loadQuotes,
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
