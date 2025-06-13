
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SUPPORTED_LOCALES, type SupportedLocale} from '@/config/locales';

export default getRequestConfig(async ({locale}: {locale: string}) => {
  // Validate that the incoming `locale` parameter is valid
  // and cast it to SupportedLocale for type safety.
  const validatedLocale = locale as SupportedLocale;
  if (!SUPPORTED_LOCALES.includes(validatedLocale)) {
    console.error(`[i18n.ts] Unsupported locale: ${locale}. Supported: ${SUPPORTED_LOCALES.join(', ')}`);
    notFound();
  }

  try {
    // Using relative path for dynamic import
    const messages = (await import(`./messages/${validatedLocale}.json`)).default;
    return {
      messages
    };
  } catch (error) {
    console.error(`[i18n.ts] Failed to load messages for locale ${validatedLocale} using relative path ./messages/${validatedLocale}.json:`, error);
    // Attempt with alias as a fallback, though the primary attempt is now relative
    try {
      console.warn(`[i18n.ts] Retrying message load for ${validatedLocale} with alias @/messages/...`);
      const messagesWithAlias = (await import(`@/messages/${validatedLocale}.json`)).default;
      return {
        messages: messagesWithAlias
      };
    } catch (aliasError) {
      console.error(`[i18n.ts] Failed to load messages for locale ${validatedLocale} with alias as well:`, aliasError);
      notFound();
    }
  }
});

