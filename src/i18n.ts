// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SUPPORTED_LOCALES, type SupportedLocale} from './config/locales';

export default getRequestConfig(async ({locale}) => {
  const currentLocale = locale as SupportedLocale;
  console.log(`[i18n.ts] getRequestConfig called for locale: "${currentLocale}"`);

  // Validate that the incoming `locale` parameter is valid
  if (!SUPPORTED_LOCALES.includes(currentLocale)) {
    console.warn(`[i18n.ts] Unsupported locale "${currentLocale}" requested. Calling notFound().`);
    notFound();
  }

  try {
    const messages = (await import(`../messages/${currentLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for locale "${currentLocale}".`);
    return {
      messages,
      // You can set a timezone here if needed, otherwise it will be inferred
      // timeZone: 'America/New_York', 
    };
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale "${currentLocale}":`, error);
    // Fallback to notFound if messages for a supported locale are missing
    notFound();
  }
});