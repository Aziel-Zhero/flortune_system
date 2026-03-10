
// src/contexts/app-settings-context.tsx

"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import type { QuoteData } from '@/types/database.types';

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
  loadQuotes: (quoteList: string[], force?: boolean) => Promise<void>;
  
  activeCampaignTheme: CampaignTheme;
  setActiveCampaignTheme: (theme: CampaignTheme) => void;

  landingPageContent: LandingPageContent;
  setLandingPageContent: Dispatch<SetStateAction<LandingPageContent>>;
  
  popupConfigs: Record<PopupType, PopupConfig>;
  setPopupConfigs: Dispatch<SetStateAction<Record<PopupType, PopupConfig>>>;
  activePopup: PopupType | null;
  setActivePopup: (popup: PopupType | null) => void;

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
};

// --- Componente de Inicialização do Cliente ---

function AppSettingsInitializer({
  setSettings,
}: {
  setSettings: (updater: (prev: AppSettingsProviderValue) => AppSettingsProviderValue) => void;
}) {
  useEffect(() => {
    try {
      const storedDarkMode = localStorage.getItem('flortune-dark-mode');
      const darkModeEnabled = storedDarkMode ? JSON.parse(storedDarkMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', darkModeEnabled);

      const storedTheme = localStorage.getItem('flortune-theme') || 'default';
      const root = document.documentElement;
      root.classList.remove(...Array.from(root.classList).filter(cls => cls.startsWith('theme-')));
      if (storedTheme !== 'default') {
        root.classList.add(storedTheme);
      }

      const storedPrivateMode = localStorage.getItem('flortune-private-mode');
      const storedCity = localStorage.getItem('flortune-weather-city');
      const storedQuotes = localStorage.getItem('flortune-selected-quotes');
      const initialQuotes = storedQuotes ? JSON.parse(storedQuotes) : ['USD-BRL', 'EUR-BRL', 'BTC-BRL', 'GBP-BRL', 'JPY-BRL'];
      const storedCampaign = localStorage.getItem('flortune-active-campaign') as CampaignTheme;
      const storedLpContent = localStorage.getItem('flortune-lp-content');
      const storedPopup = localStorage.getItem('flortune-active-popup') as PopupType;
      const storedPopupConfigs = localStorage.getItem('flortune-popup-configs');

      setSettings(prev => {
        const newState = { ...prev };
        newState.isDarkMode = darkModeEnabled;
        newState.currentTheme = storedTheme;
        if (storedPrivateMode) newState.isPrivateMode = JSON.parse(storedPrivateMode);
        if (storedCity) {
          newState.weatherCity = storedCity;
          newState.loadWeatherForCity(storedCity);
        }
        newState.selectedQuotes = initialQuotes;
        if (storedCampaign) newState.activeCampaignTheme = storedCampaign;
        if (storedLpContent) newState.landingPageContent = JSON.parse(storedLpContent);
        if (storedPopup) newState.activePopup = storedPopup;
        if (storedPopupConfigs) {
           const parsedConfigs = JSON.parse(storedPopupConfigs);
            Object.keys(parsedConfigs).forEach(key => {
                const k = key as PopupType;
                if(parsedConfigs[k].startDate) parsedConfigs[k].startDate = new Date(parsedConfigs[k].startDate);
                if(parsedConfigs[k].endDate) parsedConfigs[k].endDate = new Date(parsedConfigs[k].endDate);
            });
           newState.popupConfigs = parsedConfigs;
        }
        return newState;
      });

    } catch (error) {
      console.error("Failed to access localStorage or parse settings:", error);
    }
  }, [setSettings]);

  return null;
}

// --- Provedor ---

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const lastFetchTime = useRef<number>(0);
  const cacheDuration = 300000; // 5 minutos de cache
  const isRateLimited = useRef<boolean>(false);

  const [state, setState] = useState<AppSettingsProviderValue>({
    isPrivateMode: false,
    isDarkMode: false,
    currentTheme: 'default',
    activeCampaignTheme: null,
    weatherCity: null,
    weatherData: null,
    weatherError: null,
    isLoadingWeather: false,
    selectedQuotes: [],
    quotes: [],
    isLoadingQuotes: true,
    quotesError: null,
    landingPageContent: defaultLpContent,
    popupConfigs: defaultPopupConfigs,
    activePopup: null,
    notifications: [],
    hasUnreadNotifications: false,
    setIsPrivateMode: () => {},
    togglePrivateMode: () => {},
    setIsDarkMode: () => {},
    toggleDarkMode: () => {},
    setCurrentTheme: () => {},
    applyTheme: () => {},
    setWeatherCity: () => {},
    loadWeatherForCity: async () => {},
    setSelectedQuotes: () => {},
    loadQuotes: async () => {},
    setActiveCampaignTheme: () => {},
    setLandingPageContent: () => {},
    setPopupConfigs: () => {},
    setActivePopup: () => {},
    addNotification: () => {},
    markNotificationAsRead: () => {},
    markAllNotificationsAsRead: () => {},
    clearNotifications: () => {},
  });

  const toggleDarkMode = useCallback(() => {
    setState(prev => {
      const newIsDark = !prev.isDarkMode;
      localStorage.setItem('flortune-dark-mode', JSON.stringify(newIsDark));
      document.documentElement.classList.toggle('dark', newIsDark);
      return { ...prev, isDarkMode: newIsDark };
    });
  }, []);

  const applyTheme = useCallback((themeId: string) => {
    const root = document.documentElement;
    root.classList.remove(...Array.from(root.classList).filter(cls => cls.startsWith('theme-')));
    if (themeId !== 'default') {
      root.classList.add(themeId);
    }
    localStorage.setItem('flortune-theme', themeId);
    setState(prev => ({ ...prev, currentTheme: themeId }));
  }, []);
  
  const loadWeatherForCity = useCallback(async (city: string) => {
    if (!city) return;
    setState(prev => ({...prev, isLoadingWeather: true, weatherError: null}));
    try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha ao buscar dados do clima.');
        setState(prev => ({ ...prev, weatherData: {
            city: data.city,
            temperature: Math.round(data.temperature),
            description: data.description,
            icon: data.icon,
        }}));
    } catch (err: any) {
        setState(prev => ({ ...prev, weatherError: err.message, weatherData: null }));
    } finally {
        setState(prev => ({ ...prev, isLoadingWeather: false }));
    }
  }, []);

  const loadQuotes = useCallback(async (quoteList: string[], force: boolean = false) => {
    const validQuotes = quoteList.filter(q => q && q.trim() !== '');
    if (validQuotes.length === 0) {
      setState(prev => ({...prev, quotes: [], isLoadingQuotes: false}));
      return;
    }

    const now = Date.now();
    
    // Bloqueio temporário se estiver sofrendo rate limit (429)
    if (isRateLimited.current && now - lastFetchTime.current < 600000) { // 10 minutos de pausa
        setState(prev => ({...prev, isLoadingQuotes: false, quotesError: "Limite de requisições atingido. Sistema em pausa temporária."}));
        return;
    } else {
        isRateLimited.current = false;
    }

    // Só busca se for forçado ou se o cache expirou
    if (!force && now - lastFetchTime.current < cacheDuration) {
        setState(prev => ({...prev, isLoadingQuotes: false}));
        return; 
    }

    setState(prev => ({...prev, isLoadingQuotes: true, quotesError: null}));
    try {
        const response = await fetch(`/api/quotes?codes=${encodeURIComponent(validQuotes.join(','))}`);
        const result = await response.json();
        
        if (!response.ok) {
            if (response.status === 429) {
                isRateLimited.current = true;
                lastFetchTime.current = now;
                throw new Error("Limite de requisições atingido (429).");
            }
            throw new Error(result.error || `Erro de rede: ${response.statusText}`);
        }
        
        const dataArray = result.data || [];
        const orderedQuotes = validQuotes
            .map(code => dataArray.find((d: QuoteData) => `${d.code}-${d.codein}` === code || d.code === code))
            .filter((q): q is QuoteData => !!q);
            
        lastFetchTime.current = now;
        setState(prev => ({...prev, quotes: orderedQuotes, quotesError: null}));
    } catch (err: any) {
      console.warn('Aviso ao buscar cotações:', err.message);
      setState(prev => ({
        ...prev, 
        quotesError: err.message.includes("429") || err.message.includes("Too Many Requests")
          ? "Limite de requisições atingido. O painel entrará em pausa temporária." 
          : "Não foi possível carregar as cotações."
      }));
    } finally {
      setState(prev => ({...prev, isLoadingQuotes: false}));
    }
  }, [cacheDuration]);

  // Carrega cotações sempre que a lista de selecionadas mudar
  useEffect(() => {
    if (state.selectedQuotes.length > 0) {
      loadQuotes(state.selectedQuotes);
    }
  }, [state.selectedQuotes, loadQuotes]);

  // --- Funções de atualização que modificam o estado ---
  const value: AppSettingsProviderValue = React.useMemo(() => ({
    ...state,
    toggleDarkMode,
    applyTheme,
    loadWeatherForCity,
    loadQuotes,
    setIsPrivateMode: (value: SetStateAction<boolean>) => setState(prev => ({...prev, isPrivateMode: typeof value === 'function' ? value(prev.isPrivateMode) : value})),
    togglePrivateMode: () => setState(prev => {
        const newMode = !prev.isPrivateMode;
        localStorage.setItem('flortune-private-mode', JSON.stringify(newMode));
        return {...prev, isPrivateMode: newMode};
    }),
    setIsDarkMode: (value: SetStateAction<boolean>) => setState(prev => ({...prev, isDarkMode: typeof value === 'function' ? value(prev.isDarkMode) : value})),
    setCurrentTheme: (value: SetStateAction<string>) => setState(prev => ({...prev, currentTheme: typeof value === 'function' ? value(prev.currentTheme) : value})),
    setWeatherCity: (city: string | null) => setState(prev => {
        if(city && city.trim() !== '') {
            localStorage.setItem('flortune-weather-city', city);
            return {...prev, weatherCity: city};
        } else {
            localStorage.removeItem('flortune-weather-city');
            return {...prev, weatherCity: null, weatherData: null, weatherError: null};
        }
    }),
    setSelectedQuotes: (newQuotes: string[]) => setState(prev => {
        localStorage.setItem('flortune-selected-quotes', JSON.stringify(newQuotes));
        return {...prev, selectedQuotes: newQuotes};
    }),
    setActiveCampaignTheme: (theme: CampaignTheme) => setState(prev => {
        if (theme) {
          localStorage.setItem('flortune-active-campaign', theme);
        } else {
          localStorage.removeItem('flortune-active-campaign');
        }
        return {...prev, activeCampaignTheme: theme};
    }),
    setLandingPageContent: (value: SetStateAction<LandingPageContent>) => setState(prev => {
        const newContent = typeof value === 'function' ? value(prev.landingPageContent) : value;
        localStorage.setItem('flortune-lp-content', JSON.stringify(newContent));
        return {...prev, landingPageContent: newContent};
    }),
    setPopupConfigs: (value: SetStateAction<Record<PopupType, PopupConfig>>) => setState(prev => {
      const newConfigs = typeof value === 'function' ? value(prev.popupConfigs) : value;
      localStorage.setItem('flortune-popup-configs', JSON.stringify(newConfigs));
      return {...prev, popupConfigs: newConfigs };
    }),
    setActivePopup: (popup: PopupType | null) => setState(prev => {
        if (popup) {
          localStorage.setItem('flortune-active-popup', popup);
        } else {
          localStorage.removeItem('flortune-active-popup');
        }
        return {...prev, activePopup: popup};
    }),
     addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => setState(prev => {
        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random()}`,
            createdAt: new Date(),
            read: false,
        };
        const newNotifications = [newNotification, ...prev.notifications].slice(0, 20);
        return {...prev, notifications: newNotifications, hasUnreadNotifications: true};
    }),
    markNotificationAsRead: (id: string) => setState(prev => {
        const newNotifications = prev.notifications.map(n => n.id === id ? { ...n, read: true } : n);
        const hasUnread = newNotifications.some(n => !n.read);
        return {...prev, notifications: newNotifications, hasUnreadNotifications: hasUnread };
    }),
    markAllNotificationsAsRead: () => setState(prev => ({...prev, notifications: prev.notifications.map(n => ({...n, read: true})), hasUnreadNotifications: false})),
    clearNotifications: () => setState(prev => ({...prev, notifications: [], hasUnreadNotifications: false})),
  }), [state, toggleDarkMode, applyTheme, loadWeatherForCity, loadQuotes]);

  return (
    <AppSettingsContext.Provider value={value}>
      <AppSettingsInitializer setSettings={setState} />
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
