// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Define supported locales directly in this file for robustness.
const SUPPORTED_LOCALES_CONFIG = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
type SupportedLocaleConfig = typeof SUPPORTED_LOCALES_CONFIG[number];

console.log('[i18n.ts] File loaded. SUPPORTED_LOCALES_CONFIG:', SUPPORTED_LOCALES_CONFIG);

export default getRequestConfig(async ({locale: localeParam}) => {
  console.log(`[i18n.ts] getRequestConfig called with localeParam: "${localeParam}"`);

  const typedLocale = localeParam as SupportedLocaleConfig;

  // Validate that the incoming `locale` parameter is a supported locale
  if (!SUPPORTED_LOCALES_CONFIG.includes(typedLocale)) {
    console.error(`[i18n.ts] Unsupported locale received: "${typedLocale}". Supported: ${SUPPORTED_LOCALES_CONFIG.join(', ')}. Triggering notFound().`);
    notFound();
  }
  console.log(`[i18n.ts] Validated locale: "${typedLocale}"`);

  try {
    // Use a relative path for dynamic import of message files
    console.log(`[i18n.ts] Attempting to dynamically import messages for locale: "${typedLocale}" from path ./messages/${typedLocale}.json`);
    const messages = (await import(`./messages/${typedLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for locale: "${typedLocale}"`);
    return {
      messages
    };
  } catch (error) {
    console.error(`[i18n.ts] Critical error importing message file for locale "${typedLocale}":`, error);
    // If message file for a validated locale is not found, this is a critical configuration error.
    notFound();
  }
});
