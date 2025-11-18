// src/contexts/app-settings-context.tsx

"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { getQuotes } from '@/services/quote.service';
import type { QuoteData } from '@/types/database.types';
import { usePathname } from 'next/navigation';
import * as LucideIcons from "lucide-react";


// --- Tipos ---

export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: Date;
  icon?: React.ElementType;
  color?: 'primary' | 'destructive' | 'amber' | 'blue';
}

interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  icon: string;
}

export type CampaignTheme = 'black-friday' | 'flash-sale' | 'super-promocao' | 'aniversario' | null;
export type PopupType = 'maintenance' | 'promotion' | 'newsletter';

export interface PopupConfig {
  title: string;
  description: string;
  icon: string;
  color: 'primary' | 'destructive' | 'amber' | 'blue';
  startDate?: Date;
  endDate?: Date;
  frequencyValue?: number;
  frequencyUnit?: 'horas' | 'dias';
}

export interface LandingPageContent {
  heroTitle: string;
  heroDescription: string;
  heroImageUrl: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButtonText: string;
}

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
  
  activeCampaignTheme: CampaignTheme;
  setActiveCampaignTheme: (theme: CampaignTheme) => void;

  landingPageContent: LandingPageContent;
  setLandingPageContent: Dispatch<SetStateAction<LandingPageContent>>;
  
  popupConfigs: Record<PopupType, PopupConfig>;
  setPopupConfigs: Dispatch<SetStateAction<Record<PopupType, PopupConfig>>>;
  activePopup: PopupType | null;
  setActivePopup: (popup: PopupType | null) => void;

  // Notificações
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  hasUnreadNotifications: boolean;
}

// --- Contexto ---

const AppSettingsContext = createContext<AppSettingsProviderValue | undefined>(undefined);

// --- Dados Padrão ---

const defaultLpContent: LandingPageContent = {
  heroTitle: 'Cultive Suas Finanças e Projetos com Inteligência.',
  heroDescription: 'Flortune é a plataforma completa para organizar suas finanças pessoais e gerenciar projetos de desenvolvimento com ferramentas poderosas e insights inteligentes.',
  heroImageUrl: 'https://placehold.co/800x450.png',
  ctaTitle: "Pronto para Cultivar seu Futuro?",
  ctaDescription: "Junte-se a milhares de usuários e desenvolvedores que estão transformando suas finanças e projetos com o Flortune. É rápido, fácil e gratuito para começar.",
  ctaButtonText: "Criar Minha Conta Grátis",
};

const defaultPopupConfigs: Record<PopupType, PopupConfig> = {
  maintenance: { title: "Manutenção Agendada", description: "Estaremos realizando uma manutenção no sistema no próximo domingo das 02:00 às 04:00. O sistema poderá ficar indisponível.", icon: "Construction", color: "amber", frequencyValue: 2, frequencyUnit: 'horas' },
  promotion: { title: "Oferta Especial!", description: "Assine o plano Mestre Jardineiro hoje e ganhe 30% de desconto nos primeiros 3 meses!", icon: "Ticket", color: "primary", frequencyValue: 1, frequencyUnit: 'dias' },
  newsletter: { title: "Assine nossa Newsletter", description: "Receba dicas semanais de finanças e produtividade diretamente no seu email.", icon: "Newspaper", color: "blue", frequencyValue: 3, frequencyUnit: 'dias' },
}

// --- Provedor ---

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [activeCampaignTheme, setActiveCampaignThemeState] = useState<CampaignTheme>(null);
  
  const [weatherCity, setWeatherCityState] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const [selectedQuotes, setSelectedQuotesState] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  
  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent>(defaultLpContent);
  const [popupConfigs, setPopupConfigs] = useState<Record<PopupType, PopupConfig>>(defaultPopupConfigs);
  const [activePopup, setActivePopupState] = useState<PopupType | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const hasUnreadNotifications = notifications.some(n => !n.read);

  const pathname = usePathname();
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/dashboard-admin');
  
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const loadQuotes = useCallback(async (quoteList: string[]) => {
    const validQuotes = quoteList.filter(q => q && q.trim() !== '');
    if (validQuotes.length === 0) {
      setQuotes([]);
      setIsLoadingQuotes(false);
      return;
    }
    setIsLoadingQuotes(true);
    setQuotesError(null);
    try {
      const result = await getQuotes(validQuotes);

      if (result.error) {
        // Apenas loga o erro e atualiza o estado, não quebra a aplicação.
        console.error('Error fetching quotes from service:', result.error);
        setQuotesError(result.error);
        setQuotes([]); // Limpa as cotações em caso de erro
      } else {
        const orderedQuotes = validQuotes
          .map(code => result.data?.find(d => d.code === code.split('-')[0]))
          .filter((q): q is QuoteData => !!q);
        setQuotes(orderedQuotes);
      }
    } catch (err: any) {
      console.error('Network or other error in loadQuotes:', err);
      setQuotesError("Falha de rede ao buscar cotações.");
      setQuotes([]);
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

  const setActiveCampaignTheme = useCallback((theme: CampaignTheme) => {
    if (theme) {
      localStorage.setItem('flortune-active-campaign', theme);
    } else {
      localStorage.removeItem('flortune-active-campaign');
    }
    setActiveCampaignThemeState(theme);
  }, []);

  const setActivePopup = useCallback((popup: PopupType | null) => {
    if (popup) {
      localStorage.setItem('flortune-active-popup', popup);
    } else {
      localStorage.removeItem('flortune-active-popup');
    }
    setActivePopupState(popup);
  }, []);

  useEffect(() => {
    localStorage.setItem('flortune-lp-content', JSON.stringify(landingPageContent));
  }, [landingPageContent]);
  
  useEffect(() => {
    try {
      const storedPopupConfigs = JSON.parse(localStorage.getItem('flortune-popup-configs') || '{}');
      const mergedConfigs = { ...defaultPopupConfigs, ...storedPopupConfigs };
      // Dates are stored as strings, need to convert back to Date objects
      Object.keys(mergedConfigs).forEach(key => {
        const k = key as PopupType;
        if(mergedConfigs[k].startDate) mergedConfigs[k].startDate = new Date(mergedConfigs[k].startDate as any);
        if(mergedConfigs[k].endDate) mergedConfigs[k].endDate = new Date(mergedConfigs[k].endDate as any);
      })
      localStorage.setItem('flortune-popup-configs', JSON.stringify(mergedConfigs));
    } catch(e) { console.error("Error merging popup configs", e) }
  }, [popupConfigs]);


  useEffect(() => {
    document.body.classList.remove('theme-black-friday', 'theme-flash-sale', 'theme-super-promocao', 'aniversario');
    if (activeCampaignTheme) {
      document.body.classList.add(`theme-${activeCampaignTheme}`);
    }
  }, [activeCampaignTheme]);


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

  // Effect to load all settings from localStorage on initial mount
  useEffect(() => {
    try {
      // Load Theme and Mode
      const storedDarkMode = localStorage.getItem('flortune-dark-mode');
      const darkModeEnabled = storedDarkMode ? JSON.parse(storedDarkMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(darkModeEnabled);
      const storedTheme = localStorage.getItem('flortune-theme') || 'default';
      applyTheme(storedTheme);

      // Load Private Mode
      const storedPrivateMode = localStorage.getItem('flortune-private-mode');
      if (storedPrivateMode) setIsPrivateMode(JSON.parse(storedPrivateMode));
      
      // Load Quotes and Weather only if not in admin area
      if (!isAdminArea) {
        const storedCity = localStorage.getItem('flortune-weather-city');
        if (storedCity) {
          setWeatherCityState(storedCity);
          loadWeatherForCity(storedCity);
        }
        
        const storedQuotes = localStorage.getItem('flortune-selected-quotes');
        const defaultQuotes = ['USD-BRL', 'EUR-BRL', 'BTC-BRL', 'GBP-BRL', 'JPY-BRL'];
        const initialQuotes = storedQuotes ? JSON.parse(storedQuotes) : defaultQuotes;
        setSelectedQuotesState(initialQuotes);
        loadQuotes(initialQuotes);
        
      } else {
        setIsLoadingQuotes(false);
        setIsLoadingWeather(false);
      }

      // Load Marketing/LP settings
      const storedCampaign = localStorage.getItem('flortune-active-campaign');
      if (storedCampaign) setActiveCampaignThemeState(storedCampaign as CampaignTheme);
      
      const storedLpContent = localStorage.getItem('flortune-lp-content');
      if (storedLpContent) setLandingPageContent(JSON.parse(storedLpContent));
      
      const storedPopup = localStorage.getItem('flortune-active-popup');
      if (storedPopup) setActivePopupState(storedPopup as PopupType);
      
      const storedPopupConfigs = localStorage.getItem('flortune-popup-configs');
      if (storedPopupConfigs) {
        const parsedConfigs = JSON.parse(storedPopupConfigs);
        Object.keys(parsedConfigs).forEach(key => {
            const k = key as PopupType;
            if(parsedConfigs[k].startDate) parsedConfigs[k].startDate = new Date(parsedConfigs[k].startDate);
            if(parsedConfigs[k].endDate) parsedConfigs[k].endDate = new Date(parsedConfigs[k].endDate);
        });
        setPopupConfigs(parsedConfigs);
      }
      
    } catch (error) {
        console.error("Failed to access localStorage or parse settings:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminArea]);


  return (
    <AppSettingsContext.Provider value={{ 
      isPrivateMode, setIsPrivateMode, togglePrivateMode,
      isDarkMode, setIsDarkMode, toggleDarkMode,
      currentTheme, setCurrentTheme, applyTheme,
      weatherCity, setWeatherCity, weatherData, weatherError, loadWeatherForCity, isLoadingWeather,
      selectedQuotes, setSelectedQuotes, quotes, isLoadingQuotes, quotesError,
      loadQuotes,
      activeCampaignTheme, setActiveCampaignTheme,
      landingPageContent, setLandingPageContent,
      popupConfigs, setPopupConfigs,
      activePopup, setActivePopup,
      notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications, hasUnreadNotifications,
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
