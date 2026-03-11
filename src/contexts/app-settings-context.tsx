// src/contexts/app-settings-context.tsx
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import type { QuoteData } from '@/types/database.types';

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

const AppSettingsContext = createContext<AppSettingsProviderValue | undefined>(undefined);

const defaultLpContent: LandingPageContent = {
  heroTitle: 'Cultive Suas Finanças e Projetos com Inteligência.',
  heroDescription: 'Flortune é a plataforma completa para organizar suas finanças pessoais e gerenciar projetos de desenvolvimento com ferramentas poderosas e insights inteligentes.',
  heroImageUrl: 'https://placehold.co/800x450.png',
  ctaTitle: "Pronto para Cultivar seu Futuro?",
  ctaDescription: "Junte-se a milhares de usuários e desenvolvedores que estão transformando suas finanças e projetos com o Flortune.",
  ctaButtonText: "Criar Minha Conta Grátis",
};

const defaultPopupConfigs: Record<PopupType, PopupConfig> = {
  maintenance: { title: "Manutenção Agendada", description: "O sistema poderá ficar indisponível.", icon: "Construction", color: "amber", frequencyValue: 2, frequencyUnit: 'horas' },
  promotion: { title: "Oferta Especial!", description: "Assine o plano Mestre Jardineiro hoje!", icon: "Ticket", color: "primary", frequencyValue: 1, frequencyUnit: 'dias' },
  newsletter: { title: "Assine nossa Newsletter", description: "Receba dicas semanais.", icon: "Newspaper", color: "blue", frequencyValue: 3, frequencyUnit: 'dias' },
};

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const lastFetchTime = useRef<number>(0);
  const cacheDuration = 180000; // 3 minutos
  const rateLimitPause = useRef<boolean>(false);

  const [state, setState] = useState<any>({
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
  });

  const loadQuotes = useCallback(async (quoteList: string[], force: boolean = false) => {
    const validQuotes = quoteList.filter(q => q && q.trim() !== '');
    if (validQuotes.length === 0) return;

    const now = Date.now();
    if (!force && (now - lastFetchTime.current < cacheDuration || rateLimitPause.current)) {
        setState((prev: any) => ({...prev, isLoadingQuotes: false}));
        return;
    }

    setState((prev: any) => ({...prev, isLoadingQuotes: true, quotesError: null}));
    try {
        const response = await fetch(`/api/quotes?codes=${encodeURIComponent(validQuotes.join(','))}`);
        const result = await response.json();
        
        if (response.status === 429) {
            rateLimitPause.current = true;
            setTimeout(() => { rateLimitPause.current = false; }, 600000); // 10 min de pausa
            throw new Error("Muitas requisições. O painel de cotações entrará em pausa.");
        }

        if (!response.ok) throw new Error(result.error || 'Erro na API de cotações');
        
        lastFetchTime.current = now;
        setState((prev: any) => ({...prev, quotes: result.data || [], quotesError: null}));
    } catch (err: any) {
        setState((prev: any) => ({...prev, quotesError: err.message}));
    } finally {
        setState((prev: any) => ({...prev, isLoadingQuotes: false}));
    }
  }, []);

  const value: AppSettingsProviderValue = {
    ...state,
    toggleDarkMode: () => setState((p: any) => {
        const next = !p.isDarkMode;
        localStorage.setItem('flortune-dark-mode', JSON.stringify(next));
        document.documentElement.classList.toggle('dark', next);
        return {...p, isDarkMode: next};
    }),
    applyTheme: (themeId: string) => {
        const root = document.documentElement;
        root.classList.remove(...Array.from(root.classList).filter(cls => cls.startsWith('theme-')));
        if (themeId !== 'default') root.classList.add(themeId);
        localStorage.setItem('flortune-theme', themeId);
        setState((p: any) => ({ ...p, currentTheme: themeId }));
    },
    loadWeatherForCity: async (city: string) => {
        setState((p: any) => ({...p, isLoadingWeather: true}));
        try {
            const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            const data = await res.json();
            if (res.ok) setState((p: any) => ({...p, weatherData: data}));
        } catch(e) {} finally { setState((p: any) => ({...p, isLoadingWeather: false})); }
    },
    loadQuotes,
    setWeatherCity: (city: string | null) => setState((p: any) => ({...p, weatherCity: city})),
    setSelectedQuotes: (quotes: string[]) => setState((p: any) => ({...p, selectedQuotes: quotes})),
    setActiveCampaignTheme: (theme: CampaignTheme) => setState((p: any) => ({...p, activeCampaignTheme: theme})),
    setLandingPageContent: (content: any) => setState((p: any) => ({...p, landingPageContent: content})),
    setPopupConfigs: (configs: any) => setState((p: any) => ({...p, popupConfigs: configs})),
    setActivePopup: (popup: PopupType | null) => setState((p: any) => ({...p, activePopup: popup})),
    addNotification: (n: any) => setState((p: any) => ({...p, notifications: [{...n, id: String(Date.now()), createdAt: new Date(), read: false}, ...p.notifications].slice(0, 20), hasUnreadNotifications: true})),
    markNotificationAsRead: (id: string) => setState((p: any) => {
        const next = p.notifications.map((n: any) => n.id === id ? {...n, read: true} : n);
        return {...p, notifications: next, hasUnreadNotifications: next.some((n: any) => !n.read)};
    }),
    markAllNotificationsAsRead: () => setState((p: any) => ({...p, notifications: p.notifications.map((n: any) => ({...n, read: true})), hasUnreadNotifications: false})),
    clearNotifications: () => setState((p: any) => ({...p, notifications: [], hasUnreadNotifications: false})),
    togglePrivateMode: () => setState((p: any) => ({...p, isPrivateMode: !p.isPrivateMode})),
  };

  useEffect(() => {
    if (state.selectedQuotes.length > 0) loadQuotes(state.selectedQuotes);
  }, [state.selectedQuotes, loadQuotes]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useAppSettings must be used within an AppSettingsProvider');
  return context;
};
