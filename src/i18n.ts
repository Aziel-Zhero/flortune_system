
// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define supported locales directly in this file for robustness
const SUPPORTED_LOCALES_CONFIG = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
type SupportedLocaleConfig = typeof SUPPORTED_LOCALES_CONFIG[number];

console.log('[i18n.ts] File loaded. SUPPORTED_LOCALES_CONFIG:', SUPPORTED_LOCALES_CONFIG);

export default getRequestConfig(async ({locale: localeParam}) => {
  console.log(`[i18n.ts] getRequestConfig called with localeParam: "${localeParam}"`);

  // Validate that the incoming `locale` parameter is a supported locale
  if (!SUPPORTED_LOCALES_CONFIG.includes(localeParam as SupportedLocaleConfig)) {
    console.error(`[i18n.ts] Unsupported locale received by getRequestConfig: "${localeParam}". Supported: ${SUPPORTED_LOCALES_CONFIG.join(', ')}. Triggering notFound().`);
    notFound();
  }

  // Cast to SupportedLocaleConfig after validation for type safety
  const typedLocale = localeParam as SupportedLocaleConfig;
  console.log(`[i18n.ts] Validated locale: "${typedLocale}"`);

  try {
    // Dynamically import the messages for the current locale using a relative path
    console.log(`[i18n.ts] Attempting to dynamically import messages for locale: "${typedLocale}" from path ./messages/${typedLocale}.json`);
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
