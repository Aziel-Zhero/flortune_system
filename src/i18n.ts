// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
// Import from a relative path for robustness
import {SUPPORTED_LOCALES, type SupportedLocale} from './config/locales';

console.log('[i18n.ts] File loaded. Initializing configuration...');

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig called. Raw locale parameter: "${locale}"`);

  // Validate that the `locale` parameter is a supported locale
  const typedLocale = locale as SupportedLocale;
  if (!SUPPORTED_LOCALES.includes(typedLocale)) {
    console.error(`[i18n.ts] Invalid locale: "${typedLocale}". Supported locales are: ${SUPPORTED_LOCALES.join(', ')}. Triggering notFound().`);
    notFound();
  }

  console.log(`[i18n.ts] Locale "${typedLocale}" is valid.`);

  let messages;
  try {
    // Use a relative path for message files
    const messagePath = `./messages/${typedLocale}.json`;
    console.log(`[i18n.ts] Attempting to dynamically import messages for locale: "${typedLocale}" from "${messagePath}"`);
    messages = (await import(messagePath)).default; // Removed /* @vite-ignore */
    console.log(`[i18n.ts] Successfully imported messages for locale: "${typedLocale}".`);
  } catch (error) {
    console.error(`[i18n.ts] Error importing message file for locale "${typedLocale}":`, error);
    // Check if the error is due to the file not being found specifically for this locale
    if ((error as NodeJS.ErrnoException)?.code === 'MODULE_NOT_FOUND') {
      console.log(`[i18n.ts] Specific message file for locale "${typedLocale}" not found. Triggering notFound().`);
    } else {
      console.log(`[i18n.ts] An unexpected error occurred while importing messages for locale "${typedLocale}". Triggering notFound().`);
    }
    notFound();
  }

  return {
    messages
  };
});
