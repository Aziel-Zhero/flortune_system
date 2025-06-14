// src/i18n.ts
console.log('[i18n.ts] MODULE EXECUTION START - This should appear ONCE on server start/restart or first request.');

import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define all supported locales directly here as next-intl's middleware will validate the locale from the URL.
const supportedLocales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is a supported locale.
  // This is a safeguard, as the middleware should have already ensured this.
  if (!supportedLocales.includes(locale as any)) {
    console.warn(`[i18n.ts] Unsupported locale "${locale}" received by getRequestConfig. This should ideally be caught by middleware. Triggering notFound().`);
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale "${locale}":`, error);
    // If messages for a supposedly supported locale are missing, it's a critical error.
    notFound();
  }

  return {
    messages,
    timeZone: 'America/Sao_Paulo', // Example: Configure as needed or make dynamic
  };
});