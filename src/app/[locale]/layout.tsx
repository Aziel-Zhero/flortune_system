// src/app/[locale]/layout.tsx

import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTimeZone } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { Toaster } from "@/components/ui/toaster";
import '../globals.css';
import { SUPPORTED_LOCALES, type SupportedLocale, DEFAULT_LOCALE } from '@/config/locales'; // Para validação e fallback

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
  params: {locale: string}; // Tipo explícito para params
}>) {
  const localeFromParams = params.locale as SupportedLocale;
  console.log(`[RootLayout] Locale from params: "${localeFromParams}"`);

  // 1. Valida se a localidade dos parâmetros da URL é suportada
  if (!SUPPORTED_LOCALES.includes(localeFromParams)) {
    console.warn(`[RootLayout] Locale from params "${localeFromParams}" is not in SUPPORTED_LOCALES (${SUPPORTED_LOCALES.join(', ')}). Triggering notFound().`);
    notFound();
  }

  // 2. Tenta obter a localidade ativa do next-intl (deve corresponder a params.locale se o middleware estiver correto)
  let activeLocale: SupportedLocale;
  try {
    activeLocale = await getLocale() as SupportedLocale;
    console.log(`[RootLayout] Locale determined by getLocale(): "${activeLocale}"`);
  } catch (error) {
    console.error(`[RootLayout] Error calling getLocale():`, error);
    // Se getLocale falhar (ex: "Couldn't find config file"), isso é um erro crítico de configuração do next-intl
    // Retornar um HTML de fallback para indicar claramente o problema
    return (
        <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
            <head><title>Application Configuration Error</title></head>
            <body style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <h1>Application Configuration Error</h1>
                <p>Failed to initialize internationalization (getLocale). Details in server console.</p>
                <p>Error: {String(error)}</p>
            </body>
        </html>
    );
  }

  // 3. Verifica consistência e se activeLocale é suportada
  if (activeLocale !== localeFromParams) {
    console.warn(`[RootLayout] Mismatch: locale from params is "${localeFromParams}" but getLocale() returned "${activeLocale}". This might indicate a middleware or routing issue. Using locale from getLocale(): "${activeLocale}".`);
    // Poderia chamar notFound() aqui ou prosseguir com activeLocale.
    // Por segurança, vamos prosseguir com activeLocale, mas isso merece investigação.
  }
  if (!SUPPORTED_LOCALES.includes(activeLocale)) {
      console.error(`[RootLayout] Locale from getLocale() "${activeLocale}" is not in SUPPORTED_LOCALES. Critical error. Triggering notFound().`);
      notFound();
  }


  // 4. Tenta obter as mensagens para a localidade ativa
  let messages;
  try {
    messages = await getMessages(); // Chama sem argumento, pois getLocale() já configurou o contexto
    console.log(`[RootLayout] Attempted to fetch messages for activeLocale (determined by getLocale()): "${activeLocale}"`);
    if (!messages || Object.keys(messages).length === 0) {
        console.warn(`[RootLayout] Messages object is EMPTY or UNDEFINED for locale "${activeLocale}".`);
    } else {
        console.log(`[RootLayout] Successfully fetched messages for locale "${activeLocale}". Sample keys: ${Object.keys(messages).slice(0,5).join(', ')}`);
    }
  } catch (error) {
    console.error(`[RootLayout] Critical error fetching messages for locale "${activeLocale}":`, error);
    // Se getMessages falhar, a aplicação não pode ser traduzida.
    return (
        <html lang={activeLocale} suppressHydrationWarning>
            <head><title>Application Translation Error</title></head>
            <body style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <h1>Application Translation Error</h1>
                <p>Failed to load translation messages for locale: {activeLocale}. Details in server console.</p>
                 <p>Error: {String(error)}</p>
            </body>
        </html>
    );
  }
  
  if (!messages) {
    console.error(`[RootLayout] MESSAGES ARE UNDEFINED for locale "${activeLocale}" before rendering NextIntlClientProvider.`);
    return (
        <html lang={activeLocale} suppressHydrationWarning>
            <head>
                <title>Configuration Error - No Messages</title>
            </head>
            <body style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f0f0', color: '#333' }}>
                <h1>Application Error</h1>
                <p>Failed to load critical translation data (messages undefined) for locale: {activeLocale}.</p>
                <p>Please check server logs for more details regarding message file loading in `src/i18n.ts`.</p>
            </body>
        </html>
    );
  }

  // 5. Obtém o timezone
  let timeZone;
  try {
    timeZone = await getTimeZone(); 
    console.log(`[RootLayout] TimeZone determined: "${timeZone}" for locale "${activeLocale}"`);
  } catch (error) {
    console.warn(`[RootLayout] Could not determine timezone for locale "${activeLocale}", using default. Error:`, error);
    timeZone = 'UTC'; // Fallback timezone
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
