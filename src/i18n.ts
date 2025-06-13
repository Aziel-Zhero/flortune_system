
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SUPPORTED_LOCALES, type SupportedLocale} from '@/config/locales';

// Use direct destructuring for {locale} from the object passed by next-intl
export default getRequestConfig(async ({locale}: {locale: string}) => {
  // Validate that the incoming `locale` parameter is valid
  // and cast it to SupportedLocale for type safety.
  const validatedLocale = locale as SupportedLocale;
  if (!SUPPORTED_LOCALES.includes(validatedLocale)) {
    console.error(`Unsupported locale: ${locale}. Supported: ${SUPPORTED_LOCALES.join(', ')}`);
    notFound();
  }

  try {
    const messages = (await import(`@/messages/${validatedLocale}.json`)).default;
    return {
      messages
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${validatedLocale}:`, error);
    notFound();
  }
});
