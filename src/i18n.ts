// src/i18n.ts
console.log('[i18n.ts] MODULE EXECUTION START...');

import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define locales and defaultLocale directly within this file
// to ensure it's self-contained for its core configuration.
// These should match the locales in your `messages` folder and middleware.
const i18nLocales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
const i18nDefaultLocale: (typeof i18nLocales)[number] = 'pt';

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig CALLED for locale: "${locale}"`);

  // Use Intl.Locale to extract the base part of the locale safely.
  let baseLocale: (typeof i18nLocales)[number];
  try {
    baseLocale = new Intl.Locale(locale).baseName as (typeof i18nLocales)[number];
  } catch (e) {
    console.error(`[i18n.ts] Invalid locale format passed to getRequestConfig: "${locale}". Falling back to default.`);
    baseLocale = i18nDefaultLocale;
  }

  // Validate that the determined baseLocale is one of the supported i18nLocales.
  if (!i18nLocales.includes(baseLocale)) {
    console.warn(`[i18n.ts] Determined locale "${baseLocale}" is not in defined i18nLocales. Triggering notFound().`);
    notFound();
  }

  let messages;
  try {
    // The path is relative to the `src` directory, and `messages` is at the root.
    messages = (await import(`../messages/${baseLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for locale: "${baseLocale}"`);
  } catch (error) {
    console.error(`[i18n.ts] FAILED to load messages for locale "${baseLocale}":`, error);
    // If messages can't be loaded, it's a critical error condition.
    notFound();
  }

  if (!messages || Object.keys(messages).length === 0) {
    console.error(`[i18n.ts] Messages are undefined or empty for locale "${baseLocale}". This likely means the .json file is missing or empty.`);
    notFound();
  }

  return {
    messages,
    // You can configure the time zone here if necessary
    // timeZone: 'America/New_York',
  };
});
