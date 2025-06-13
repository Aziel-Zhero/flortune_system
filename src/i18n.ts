// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SUPPORTED_LOCALES, type SupportedLocale} from './config/locales'; // Relative import

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is a valid supported locale
  const typedLocale = locale as SupportedLocale;
  if (!SUPPORTED_LOCALES.includes(typedLocale)) {
    // Log an error and trigger notFound for unsupported locales
    console.error(`[i18n.ts] Unsupported locale: "${typedLocale}". Supported: ${SUPPORTED_LOCALES.join(', ')}`);
    notFound();
  }

  try {
    return {
      // Dynamically import messages for the given locale using a relative path
      messages: (await import(`./messages/${typedLocale}.json`)).default
    };
  } catch (error) {
    // Log if a specific message file is not found or is invalid
    console.error(`[i18n.ts] Could not load messages for locale "${typedLocale}":`, error);
    notFound();
  }
});
