// src/contexts/app-settings-context.tsx

"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import type { QuoteData } from '@/services/quote.service';

// Tipos para os dados do clima
interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  icon: string;
}

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
  weatherCity: string | null;
  setWeatherCity: (city: string | null) => void;
  weatherData: WeatherData | null;
  weatherError: string | null;
  loadWeatherForCity: (city: string) => Promise<void>;
  isLoadingWeather: boolean;
  
  selectedQuotes: string[];
  setSelectedQuotes: (quotes: string[]) => void;
  quotes: QuoteData[];
  isLoadingQuotes: boolean;
  quotesError: string | null;
  loadQuotes: (quoteList: string[]) => Promise<void>;
  
  isBlackFridayActive: boolean;
  toggleBlackFriday: () => void;
}

const AppSettingsContext = createContext<AppSettingsProviderValue | undefined>(undefined);

const mockQuotes: QuoteData[] = [
  { code: "USD-BRL", codein: 'BRL', name: 'Dólar Comercial', high: '5.45', low: '5.40', varBid: '0.01', pctChange: '0.18', bid: '5.42', ask: '5.42', timestamp: String(Date.now()), create_date: new Date().toISOString() },
  { code: "EUR-BRL", codein: 'BRL', name: 'Euro', high: '5.85', low: '5.80', varBid: '0.02', pctChange: '0.34', bid: '5.83', ask: '5.83', timestamp: String(Date.now()), create_date: new Date().toISOString() },
  { code: "BTC-BRL", codein: 'BRL', name: 'Bitcoin', high: '340000', low: '330000', varBid: '5000', pctChange: '1.50', bid: '335000', ask: '335100', timestamp: String(Date.now()), create_date: new Date().toISOString() },
  { code: "IBOV", codein: 'BRL', name: 'Ibovespa', high: '125000', low: '124000', varBid: '500', pctChange: '0.40', bid: '124500', ask: '124500', timestamp: String(Date.now()), create_date: new Date().toISOString() },
  { code: "NASDAQ", codein: 'BRL', name: 'Nasdaq', high: '18000', low: '17900', varBid: '100', pctChange: '0.55', bid: '17950', ask: '17950', timestamp: String(Date.now()), create_date: new Date().toISOString() },
];

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isBlackFridayActive, setIsBlackFridayActive] = useState(false);
  
  const [weatherCity, setWeatherCityState] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const [selectedQuotes, setSelectedQuotesState] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  const loadQuotes = useCallback(async (quoteList: string[]) => {
    setIsLoadingQuotes(true);
    setQuotesError(null);
    const validQuotes = quoteList.filter(q => q && q.trim() !== '');
    if (validQuotes.length === 0) {
      setQuotes([]);
      setIsLoadingQuotes(false);
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      const orderedQuotes = validQuotes
        .map(code => mockQuotes.find(mq => mq.code === code))
        .filter((q): q is QuoteData => !!q);
      setQuotes(orderedQuotes);
    } catch (error) {
      setQuotesError('Erro ao carregar cotações');
      console.error('Error loading quotes:', error);
    } finally {
      setIsLoadingQuotes(false);
    }
  }, []);

  const setSelectedQuotes = useCallback((newQuotes: string[]) => {
    localStorage.setItem('flortune-selected-quotes', JSON.stringify(newQuotes));
    setSelectedQuotesState(newQuotes);
    loadQuotes(newQuotes);
  }, [loadQuotes]);
  
  const loadWeatherForCity = useCallback(async (city: string) => {
    if (!city) return;
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha ao buscar dados do clima.');
        setWeatherData({
            city: data.city,
            temperature: Math.round(data.temperature),
            description: data.description,
            icon: data.icon,
        });
    } catch (err: any) {
        setWeatherError(err.message);
        setWeatherData(null);
        toast({ title: "Erro ao buscar clima", description: err.message, variant: "destructive" });
    } finally {
        setIsLoadingWeather(false);
    }
  }, []);

  const setWeatherCity = (city: string | null) => {
      if(city && city.trim() !== '') {
          localStorage.setItem('flortune-weather-city', city);
          setWeatherCityState(city);
      } else {
          localStorage.removeItem('flortune-weather-city');
          setWeatherCityState(null);
          setWeatherData(null);
          setWeatherError(null);
      }
  };

  const applyTheme = useCallback((themeId: string) => {
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
      localStorage.setItem('flortune-dark-mode', JSON.stringify(newIsDark));
      return newIsDark;
    });
  }, []);

  const toggleBlackFriday = useCallback(() => {
    setIsBlackFridayActive(prev => {
      const newStatus = !prev;
      localStorage.setItem('flortune-black-friday-active', JSON.stringify(newStatus));
      return newStatus;
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('black-friday-active', isBlackFridayActive);
  }, [isBlackFridayActive]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const togglePrivateMode = useCallback(() => {
    setIsPrivateMode(prev => {
        const newMode = !prev;
        localStorage.setItem('flortune-private-mode', JSON.stringify(newMode));
        return newMode;
    });
  }, []);

  useEffect(() => {
    try {
      const storedPrivateMode = localStorage.getItem('flortune-private-mode');
      if (storedPrivateMode) setIsPrivateMode(JSON.parse(storedPrivateMode));

      const storedDarkMode = localStorage.getItem('flortune-dark-mode');
      const darkModeEnabled = storedDarkMode ? JSON.parse(storedDarkMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(darkModeEnabled);
      
      const storedTheme = localStorage.getItem('flortune-theme') || 'default';
      applyTheme(storedTheme);

      const storedCity = localStorage.getItem('flortune-weather-city');
      if (storedCity) {
        setWeatherCityState(storedCity);
        loadWeatherForCity(storedCity);
      }
      
      const storedQuotes = localStorage.getItem('flortune-selected-quotes');
      const initialQuotes = storedQuotes ? JSON.parse(storedQuotes) : ['USD-BRL', 'EUR-BRL', 'BTC-BRL', 'IBOV', 'NASDAQ'];
      setSelectedQuotesState(initialQuotes);
      loadQuotes(initialQuotes);

      const storedBlackFriday = localStorage.getItem('flortune-black-friday-active');
      if (storedBlackFriday) setIsBlackFridayActive(JSON.parse(storedBlackFriday));
      
    } catch (error) {
        console.error("Failed to access localStorage or parse settings:", error);
    }
  }, [applyTheme, loadWeatherForCity, loadQuotes]);

  return (
    <AppSettingsContext.Provider value={{ 
      isPrivateMode, setIsPrivateMode, togglePrivateMode,
      isDarkMode, setIsDarkMode, toggleDarkMode,
      currentTheme, setCurrentTheme, applyTheme,
      weatherCity, setWeatherCity, weatherData, weatherError, loadWeatherForCity, isLoadingWeather,
      selectedQuotes, setSelectedQuotes, quotes, isLoadingQuotes, quotesError,
      loadQuotes,
      isBlackFridayActive, toggleBlackFriday,
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
