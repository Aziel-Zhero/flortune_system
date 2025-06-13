import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SUPPORTED_LOCALES} from '@/config/locales';

// Can be imported from a shared config
// export const locales = ['en', 'pt', 'es', 'fr', 'ja', 'zh']; // Moved to config/locales.ts
// export const defaultLocale = 'pt'; // Moved to config/locales.ts

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!SUPPORTED_LOCALES.includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
