
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

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
}

const AppSettingsContext = createContext<AppSettingsProviderValue | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  
  const [weatherCity, setWeatherCityState] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // --- Funções e Efeitos para Clima ---
  const loadWeatherForCity = useCallback(async (city: string) => {
    if (!city) return;
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Falha ao buscar dados do clima.');
        }
        
        setWeatherData({
            city: data.name,
            temperature: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: data.weather[0].icon,
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

  useEffect(() => {
    try {
      const storedPrivateMode = localStorage.getItem('flortune-private-mode');
      if (storedPrivateMode) setIsPrivateMode(JSON.parse(storedPrivateMode));

      const storedDarkMode = localStorage.getItem('flortune-dark-mode');
      const darkModeEnabled = storedDarkMode ? JSON.parse(storedDarkMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(darkModeEnabled);
      
      const storedTheme = localStorage.getItem('flortune-theme') || 'default';
      setCurrentTheme(storedTheme);

      const storedCity = localStorage.getItem('flortune-weather-city');
      if (storedCity) {
        setWeatherCityState(storedCity);
        loadWeatherForCity(storedCity);
      }
    } catch (error) {
        console.error("Failed to access localStorage or parse settings:", error);
    }
  }, [loadWeatherForCity]);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  const togglePrivateMode = useCallback(() => {
    setIsPrivateMode(prev => {
        const newMode = !prev;
        localStorage.setItem('flortune-private-mode', JSON.stringify(newMode));
        return newMode;
    });
  }, []);

  return (
    <AppSettingsContext.Provider value={{ 
      isPrivateMode, setIsPrivateMode, togglePrivateMode,
      isDarkMode, setIsDarkMode, toggleDarkMode,
      currentTheme, setCurrentTheme, applyTheme,
      weatherCity, setWeatherCity, weatherData, weatherError, loadWeatherForCity, isLoadingWeather
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
