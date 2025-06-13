// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define supported locales directly in this file for robustness with build tools
const SUPPORTED_LOCALES_CONFIG = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
type SupportedLocaleConfig = typeof SUPPORTED_LOCALES_CONFIG[number];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is a supported locale
  if (!SUPPORTED_LOCALES_CONFIG.includes(locale as SupportedLocaleConfig)) {
    console.error(`[i18n.ts] Unsupported locale received by getRequestConfig: "${locale}". Supported: ${SUPPORTED_LOCALES_CONFIG.join(', ')}. Triggering notFound().`);
    notFound();
  }

  // Cast to SupportedLocaleConfig after validation for type safety
  const typedLocale = locale as SupportedLocaleConfig;

  try {
    // Dynamically import the messages for the current locale using a relative path
    // The .default is important because dynamic imports return a module object
    const messages = (await import(`./messages/${typedLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for locale: "${typedLocale}"`);
    return {
      messages
    };
  } catch (error) {
    console.error(`[i18n.ts] Critical error importing message file for locale "${typedLocale}":`, error);
    // If a message file is missing or malformed for a supported locale, it's a critical setup error.
    notFound();
  }
});
