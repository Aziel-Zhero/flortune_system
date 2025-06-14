// src/app/[locale]/layout.tsx
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages, getTimeZone} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale} from '@/config/locales';
import {AppSettingsProvider} from '@/contexts/app-settings-context';
import {Toaster} from "@/components/ui/toaster";
import '../globals.css'; // Styles for the main HTML document
import type { Metadata } from 'next'; // Import Metadata type

// Metadata for the root layout (can be generic)
export const metadata: Metadata = {
  title: 'Flortune - Your Financial Gardener',
  description: 'Cultivate your finances with Flortune. Track, analyze, and grow your wealth with smart insights and intuitive tools.',
  icons: {
    icon: '/icon.svg',
  }
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const localeFromParams = params.locale as SupportedLocale;
  console.log(`[LocaleLayout] Locale from params: "${localeFromParams}"`);

  if (!SUPPORTED_LOCALES.includes(localeFromParams)) {
    console.warn(`[LocaleLayout] Invalid locale in params: "${localeFromParams}". Triggering notFound().`);
    notFound();
  }

  let activeLocale: SupportedLocale;
  try {
    console.log(`[LocaleLayout] Attempting to call getLocale()...`);
    activeLocale = await getLocale() as SupportedLocale;
    console.log(`[LocaleLayout] Locale determined by getLocale(): "${activeLocale}"`);
  } catch (error) {
    console.error(`[LocaleLayout] Error calling getLocale():`, error);
    // Fallback to default or param locale if getLocale fails catastrophically
    // This usually means next-intl config wasn't found.
    return (
        <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
            <head><title>Application Configuration Error</title></head>
            <body className="font-body antialiased" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <h1>Application Configuration Error</h1>
                <p>Failed to initialize internationalization (getLocale). Details in server console.</p>
                <p>Error: {String(error)}</p>
                <p>Params locale was: {localeFromParams}</p>
            </body>
        </html>
    );
  }
  
  if (activeLocale !== localeFromParams) {
    console.warn(`[LocaleLayout] Locale mismatch: param is "${localeFromParams}", getLocale() is "${activeLocale}". This might indicate a middleware or routing issue. Using activeLocale: "${activeLocale}"`);
  }
  if (!SUPPORTED_LOCALES.includes(activeLocale)) {
      console.error(`[LocaleLayout] Locale from getLocale() "${activeLocale}" is not supported. Critical error.`);
      return (
        <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
            <head><title>Unsupported Locale Error</title></head>
            <body className="font-body antialiased" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <h1>Unsupported Locale</h1>
                <p>The locale &quot;{activeLocale}&quot; is not supported by the application.</p>
            </body>
        </html>
    );
  }
  
  let messages;
  try {
    console.log(`[LocaleLayout] Attempting to call getMessages() for activeLocale: "${activeLocale}"...`);
    messages = await getMessages(); // Uses locale from getLocale() context
    console.log(`[LocaleLayout] Messages loaded for "${activeLocale}". Keys found: ${Object.keys(messages || {}).length}`);
  } catch (error) {
    console.error(`[LocaleLayout] Critical error fetching messages for locale "${activeLocale}":`, error);
    return (
        <html lang={activeLocale} suppressHydrationWarning>
            <head><title>Application Translation Error</title></head>
            <body className="font-body antialiased" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <h1>Application Translation Error</h1>
                <p>Failed to load translation messages for locale: {activeLocale}.</p>
                <p>Error: {String(error)}</p>
            </body>
        </html>
    );
  }

  if (!messages || Object.keys(messages).length === 0) {
    console.error(`[LocaleLayout] Messages are undefined or empty for locale "${activeLocale}". This likely means the .json file is missing or empty.`);
     return (
        <html lang={activeLocale} suppressHydrationWarning>
            <head><title>Configuration Error - No Messages</title></head>
            <body className="font-body antialiased" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <h1>Application Error</h1>
                <p>Failed to load critical translation data (messages are empty) for locale: {activeLocale}. Check messages/{activeLocale}.json.</p>
            </body>
        </html>
    );
  }

  let timeZone;
  try {
    timeZone = await getTimeZone({locale: activeLocale}); 
    console.log(`[LocaleLayout] Timezone for "${activeLocale}": ${timeZone}`);
  } catch (error) {
    console.warn(`[LocaleLayout] Could not determine timezone for locale "${activeLocale}", using default. Error:`, error);
    timeZone = 'UTC'; // Default timezone
  }

  return (
    <html lang={activeLocale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppSettingsProvider>
          <NextIntlClientProvider
            locale={activeLocale}
            messages={messages}
            timeZone={timeZone}
          >
            {children}
          </NextIntlClientProvider>
          <Toaster />
        </AppSettingsProvider>
      </body>
    </html>
  );
}
