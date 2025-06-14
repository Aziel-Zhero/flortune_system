// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define supported locales directly within this file for self-containment.
const supportedLocales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
type AppLocale = typeof supportedLocales[number];

export default getRequestConfig(async ({locale}) => {
  const baseLocale = locale.split('-')[0] as AppLocale;

  // Validate that the incoming `locale` parameter is a supported locale.
  if (!supportedLocales.includes(baseLocale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../messages/${baseLocale}.json`)).default;
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale "${baseLocale}":`, error);
    notFound();
  }

  return {
    messages,
    timeZone: 'America/Sao_Paulo', // Example: Configure as needed or make dynamic
  };
});
