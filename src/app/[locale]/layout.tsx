
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server'; // Ensure getLocale is imported
import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { Toaster } from "@/components/ui/toaster";
import '../globals.css'; // Adjusted path

export const metadata: Metadata = {
  title: 'Flortune - Your Financial Gardener',
  description: 'Cultivate your finances with Flortune. Track, analyze, and grow your wealth with smart insights and intuitive tools.',
  icons: {
    icon: '/icon.svg',
  }
};

export default async function RootLayout({
  children,
  params // params object is passed by Next.js
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string}; // Type for params
}>) {
  // Use getLocale() to determine the active locale for fetching messages.
  // This is robust as it relies on next-intl's determination of the locale.
  const activeLocale = await getLocale();
  const messages = await getMessages({locale: activeLocale});

  // params.locale (from the URL) is used for the html lang attribute and NextIntlClientProvider.
  const pageLocale = params.locale;

  return (
    <html lang={pageLocale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={pageLocale} messages={messages}>
          <AppSettingsProvider>
            {children}
            <Toaster />
          </AppSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
