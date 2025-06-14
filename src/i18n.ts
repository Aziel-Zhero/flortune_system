// src/i18n.ts
console.log('[i18n.ts] MODULE EXECUTION START - This should appear ONCE on server start/restart or first request.');

import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define locales and default locale directly in this file
// This list must match the `locales` in `src/middleware.ts`
const locales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
export type SupportedLocaleForI18n = typeof locales[number];

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig called for locale: "${locale}"`);

  // Validate that the incoming `locale` parameter is one of the supported ones
  if (!locales.includes(locale as SupportedLocaleForI18n)) {
    console.warn(`[i18n.ts] Unsupported locale "${locale}" passed to getRequestConfig. Triggering notFound().`);
    notFound();
  }

  let messages;
  try {
    // Path relative to `src` directory (where i18n.ts is) to `messages` in project root.
    console.log(`[i18n.ts] Attempting to load messages for "${locale}" from "../messages/${locale}.json"`);
    messages = (await import(`../messages/${locale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for "${locale}". Keys sample: ${Object.keys(messages || {}).slice(0,3).join(', ')}`);
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale "${locale}":`, error);
    // If a message file for a supposedly supported locale is missing, it's a critical setup error.
    throw new Error(`Message file for locale "${locale}" not found or invalid. Original error: ${error}`);
  }

  if (!messages || Object.keys(messages).length === 0) {
    console.warn(`[i18n.ts] Messages object for locale "${locale}" is empty or undefined after import.`);
     throw new Error(`Messages for locale "${locale}" are empty or undefined.`);
  }

  return {
    messages,
    timeZone: 'America/Sao_Paulo', // Example, configure as needed. Consistent timezone helps.
  };
});
