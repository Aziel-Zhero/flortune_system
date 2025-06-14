// src/i18n.ts
console.log('[i18n.ts] MODULE EXECUTION START - This should appear ONCE on server start/restart or first request.');

import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Defina as localidades suportadas e a padrão DIRETAMENTE AQUI para getRequestConfig
const SUPPORTED_LOCALES_CONFIG = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
type SupportedLocaleConfig = typeof SUPPORTED_LOCALES_CONFIG[number];
const DEFAULT_LOCALE_CONFIG: SupportedLocaleConfig = 'pt';

export default getRequestConfig(async ({locale}) => {
  const typedLocale = locale as SupportedLocaleConfig;
  console.log(`[i18n.ts] getRequestConfig called for locale: "${typedLocale}"`);

  if (!SUPPORTED_LOCALES_CONFIG.includes(typedLocale)) {
    console.warn(`[i18n.ts] Unsupported locale "${typedLocale}" passed to getRequestConfig. Triggering notFound().`);
    notFound();
  }

  let messages;
  try {
    // O caminho é relativo a partir da pasta `src` para a pasta `messages` na raiz.
    messages = (await import(`../messages/${typedLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for locale "${typedLocale}". Keys sample: ${Object.keys(messages || {}).slice(0,3).join(', ')}`);
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale "${typedLocale}":`, error);
    // Se um arquivo de mensagem para uma localidade supostamente suportada estiver faltando, é um erro crítico.
    notFound();
  }

  if (!messages || Object.keys(messages).length === 0) {
    console.warn(`[i18n.ts] Messages object for locale "${typedLocale}" is empty or undefined after import.`);
    // Considerar notFound() aqui também, pois uma página sem texto não é utilizável.
    notFound();
  }

  return {
    messages,
    timeZone: 'America/Sao_Paulo', // Exemplo, configure conforme necessário.
  };
});