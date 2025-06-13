
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server'; 
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

  // 1. Determine the active locale using getLocale()
  let activeLocale: SupportedLocale;
  try {
    activeLocale = await getLocale() as SupportedLocale;
    console.log(`[RootLayout] Locale determined by getLocale(): "${activeLocale}"`);
  } catch (error) {
    console.error(`[RootLayout] Error calling getLocale():`, error);
    notFound();
  }

  // 2. Validate that params.locale matches activeLocale and both are supported
  if (!SUPPORTED_LOCALES.includes(localeFromParams)) {
    console.error(`[RootLayout] Locale from params "${localeFromParams}" is not supported. Triggering notFound().`);
    notFound();
  }
  if (!SUPPORTED_LOCALES.includes(activeLocale)) {
    console.error(`[RootLayout] Locale from getLocale() "${activeLocale}" is not supported. Critical error. Triggering notFound().`);
    notFound();
  }
  if (localeFromParams !== activeLocale) {
    console.warn(`[RootLayout] Locale mismatch: params.locale is "${localeFromParams}", but getLocale() returned "${activeLocale}". Using activeLocale: "${activeLocale}".`);
    // It's generally safer to trust activeLocale if getLocale() succeeded and is supported.
    // If the URL was manipulated to an unsupported locale, the first check on localeFromParams would catch it.
  }
  
  // 3. Fetch messages for the activeLocale.
  // Call getMessages() without arguments, relying on getLocale() having set the context.
  let messages;
  try {
    console.log(`[RootLayout] Attempting to get messages for activeLocale: "${activeLocale}"`);
    messages = await getMessages(); 
    console.log(`[RootLayout] Successfully fetched messages for activeLocale: "${activeLocale}"`);
  } catch (error) {
    console.error(`[RootLayout] Critical error fetching messages for activeLocale "${activeLocale}":`, error);
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
