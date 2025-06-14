// src/app/[locale]/layout.tsx

import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { Toaster } from "@/components/ui/toaster";
import '../globals.css';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/config/locales'; // For validation

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

  // 1. Validate localeFromParams comes from a known list of supported locales
  if (!SUPPORTED_LOCALES.includes(localeFromParams)) {
    console.error(`[RootLayout] Locale from params "${localeFromParams}" is not in SUPPORTED_LOCALES. Triggering notFound().`);
    notFound();
  }

  // 2. Determine the active locale using getLocale()
  let activeLocale: SupportedLocale;
  try {
    activeLocale = await getLocale() as SupportedLocale;
    console.log(`[RootLayout] Locale determined by getLocale(): "${activeLocale}"`);
  } catch (error) {
    console.error(`[RootLayout] Error calling getLocale():`, error);
    // This is often where "Couldn't find config" originates if getLocale itself fails.
    notFound();
  }

  // 3. Validate activeLocale (from getLocale) and ensure consistency with params.locale
  if (!SUPPORTED_LOCALES.includes(activeLocale)) {
    console.error(`[RootLayout] Locale from getLocale() "${activeLocale}" is not in SUPPORTED_LOCALES. Critical error. Triggering notFound().`);
    notFound();
  }

  if (localeFromParams !== activeLocale) {
    console.warn(`[RootLayout] Locale mismatch: params.locale is "${localeFromParams}", but getLocale() returned "${activeLocale}". This might indicate an issue with middleware or routing. Triggering notFound() for safety.`);
    notFound();
  }
  
  // 4. Fetch messages for the activeLocale.
  // Call getMessages() without arguments, relying on getLocale() having set the context.
  let messages;
  try {
    console.log(`[RootLayout] Attempting to get messages for activeLocale (determined by getLocale()): "${activeLocale}"`);
    messages = await getMessages(); 
    console.log(`[RootLayout] Successfully fetched messages for activeLocale: "${activeLocale}"`);
  } catch (error) {
    console.error(`[RootLayout] Critical error fetching messages for activeLocale "${activeLocale}":`, error);
    // If getMessages throws (e.g., "Couldn't find config file" or specific message file error),
    // this will trigger notFound.
    notFound();
  }

  return (
    <html lang={activeLocale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={activeLocale} messages={messages}>
          <AppSettingsProvider>
            {children}
            <Toaster />
          </AppSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
