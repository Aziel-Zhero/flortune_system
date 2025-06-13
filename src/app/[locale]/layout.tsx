
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
// Ensure this is the correct import for server-side message fetching
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation'; // For handling invalid locales

import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { Toaster } from "@/components/ui/toaster";
import '../globals.css'; // Adjusted path due to [locale] segment
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
  params // params object is passed by Next.js, contains `locale`
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string}; // Explicitly type params
}>) {
  const currentLocale = params.locale as SupportedLocale;

  // Validate that the `params.locale` (now currentLocale) is a supported locale
  if (!SUPPORTED_LOCALES.includes(currentLocale)) {
    console.error(`[RootLayout] Unsupported locale from params: ${params.locale}. Supported: ${SUPPORTED_LOCALES.join(', ')}`);
    notFound();
  }

  let messages;
  try {
    // Attempt to get messages using the validated locale from params
    messages = await getMessages({ locale: currentLocale });
  } catch (error) {
    console.error(`[RootLayout] Critical error fetching messages for locale "${currentLocale}":`, error);
    // If getMessages throws (e.g., "Couldn't find config file" or specific message file error),
    // then the i18n system cannot initialize.
    notFound();
  }

  return (
    <html lang={currentLocale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={currentLocale} messages={messages}>
          <AppSettingsProvider>
            {children}
            <Toaster />
          </AppSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
