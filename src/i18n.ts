// src/i18n.ts
console.log('[i18n.ts] MODULE EXECUTION START - This should appear ONCE on server start/restart or first request.');

import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define locales and defaultLocale directly in this file for getRequestConfig
const i18nLocales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
type I18nSupportedLocale = typeof i18nLocales[number];
const i18nDefaultLocale: I18nSupportedLocale = 'pt';

export default getRequestConfig(async ({locale}) => {
  // The 'locale' param from getRequestConfig is the resolved locale
  const baseLocale = locale as I18nSupportedLocale;
  console.log(`[i18n.ts] getRequestConfig called for locale: "${baseLocale}"`);

  // Validate if the resolved locale is supported
  if (!i18nLocales.includes(baseLocale)) {
    console.warn(`[i18n.ts] Unsupported locale "${baseLocale}" received by getRequestConfig. This shouldn't happen if middleware is correct. Triggering notFound().`);
    notFound();
  }

  let messages;
  try {
    // Path is relative from `src/` (where i18n.ts is) to `messages/` at the project root.
    messages = (await import(`../messages/${baseLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for locale "${baseLocale}". Keys sample: ${Object.keys(messages || {}).slice(0,3).join(', ')}`);
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale "${baseLocale}":`, error);
    // If a message file for a supported locale is missing, it's a critical error.
    notFound();
  }

  if (!messages || Object.keys(messages).length === 0) {
    console.warn(`[i18n.ts] Messages object for locale "${baseLocale}" is empty or undefined after import.`);
    // Consider notFound() here as well, as a page without text is not usable.
    notFound();
  }

  return {
    messages,
    timeZone: 'America/Sao_Paulo', // Example, configure as needed or make dynamic.
  };
});
