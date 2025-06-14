// src/app/[locale]/layout.tsx

import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTimeZone } from 'next-intl/server'; // Adicionado getTimeZone
import { notFound } from 'next/navigation';

import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { Toaster } from "@/components/ui/toaster";
import '../globals.css';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/config/locales';

export const metadata: Metadata = {
  title: 'Flortune - Your Financial Gardener',
  description: 'Cultivate your finances with Flortune. Track, analyze, and grow your wealth with smart insights and intuitive tools.',
  icons: {
    icon: '/icon.svg',
  }
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const localeFromParams = params.locale as SupportedLocale;
  console.log(`[RootLayout] Locale from params: "${localeFromParams}"`);

  if (!SUPPORTED_LOCALES.includes(localeFromParams)) {
    console.error(`[RootLayout] Locale from params "${localeFromParams}" is not in SUPPORTED_LOCALES. Triggering notFound().`);
    notFound();
  }

  let activeLocale: SupportedLocale;
  try {
    activeLocale = await getLocale() as SupportedLocale;
    console.log(`[RootLayout] Locale determined by getLocale(): "${activeLocale}"`);
  } catch (error) {
    console.error(`[RootLayout] Error calling getLocale():`, error);
    // Se getLocale falhar, pode indicar um problema fundamental na configuração.
    notFound(); 
  }

  if (localeFromParams !== activeLocale) {
    console.warn(`[RootLayout] Locale mismatch: params.locale is "${localeFromParams}", but getLocale() returned "${activeLocale}". This might indicate an issue with middleware or routing. Triggering notFound() for safety.`);
    notFound();
  }

  if (!SUPPORTED_LOCALES.includes(activeLocale)) {
    console.error(`[RootLayout] Locale from getLocale() "${activeLocale}" is not in SUPPORTED_LOCALES. Critical error. Triggering notFound().`);
    notFound();
  }

  let messages;
  try {
    messages = await getMessages();
    console.log(`[RootLayout] Attempted to fetch messages for activeLocale (determined by getLocale()): "${activeLocale}"`);
    if (!messages || Object.keys(messages).length === 0) {
        console.warn(`[RootLayout] Messages object is EMPTY or UNDEFINED for locale "${activeLocale}". This will likely lead to a blank page or missing text.`);
    } else {
        console.log(`[RootLayout] Successfully fetched messages for locale "${activeLocale}". Sample keys: ${Object.keys(messages).slice(0,5).join(', ')}`);
    }
  } catch (error) {
    console.error(`[RootLayout] Critical error fetching messages for locale "${activeLocale}":`, error);
    notFound();
  }

  let timeZone;
  try {
    timeZone = await getTimeZone(); 
    console.log(`[RootLayout] TimeZone determined: "${timeZone}" for locale "${activeLocale}"`);
  } catch (error) {
    console.warn(`[RootLayout] Could not determine timezone for locale "${activeLocale}", using default. Error:`, error);
    timeZone = 'UTC'; // Fallback timezone
  }


  if (!messages) {
    console.error(`[RootLayout] MESSAGES ARE UNDEFINED for locale "${activeLocale}" before rendering NextIntlClientProvider.`);
    // Retornar um HTML de fallback para indicar claramente o problema
    return (
        <html lang={activeLocale || 'en'} suppressHydrationWarning>
            <head>
                <title>Configuration Error</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body antialiased" style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f0f0', color: '#333' }}>
                <h1>Application Error</h1>
                <p>Failed to load critical translation data for locale: {activeLocale || 'unknown'}.</p>
                <p>Please check server logs for more details.</p>
            </body>
        </html>
    );
  }

  console.log(`[RootLayout] Rendering NextIntlClientProvider with locale: "${activeLocale}", timezone: "${timeZone}", and messages object.`);

  return (
    <html lang={activeLocale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider
          locale={activeLocale}
          messages={messages}
          timeZone={timeZone} 
        >
          <AppSettingsProvider>
            {children}
            <Toaster />
          </AppSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
