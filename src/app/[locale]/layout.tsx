// src/app/[locale]/layout.tsx

import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { Toaster } from "@/components/ui/toaster";
import '../globals.css'; // Caminho para o CSS global
// Importa SUPPORTED_LOCALES de src/config/locales.ts para validação interna do params.locale
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
  params: {locale: string}; // Tipo explícito para params
}>) {
  const localeFromParams = params.locale as SupportedLocale;
  console.log(`[RootLayout] Locale from params: "${localeFromParams}"`);

  // 1. Valida se a localidade dos parâmetros da URL é suportada
  if (!SUPPORTED_LOCALES.includes(localeFromParams)) {
    console.error(`[RootLayout] Locale from params "${localeFromParams}" is not in SUPPORTED_LOCALES. Triggering notFound().`);
    notFound();
  }

  // 2. Obtém a localidade ativa do next-intl (deve ser configurada pelo middleware)
  let activeLocale: SupportedLocale;
  try {
    activeLocale = await getLocale() as SupportedLocale;
    console.log(`[RootLayout] Locale determined by getLocale(): "${activeLocale}"`);
  } catch (error) {
    console.error(`[RootLayout] Error calling getLocale():`, error);
    // Se getLocale falhar, pode indicar que o config do next-intl ainda não foi encontrado.
    // O erro "Couldn't find next-intl config file" pode originar aqui.
    notFound();
  }

  // 3. Valida a consistência entre params.locale e activeLocale e se activeLocale é suportada
  if (localeFromParams !== activeLocale) {
    console.warn(`[RootLayout] Locale mismatch: params.locale is "${localeFromParams}", but getLocale() returned "${activeLocale}". This might indicate an issue with middleware or routing. Triggering notFound() for safety.`);
    notFound();
  }
  // Valida novamente activeLocale, pois getLocale() pode, em teoria, retornar algo inesperado se mal configurado.
  if (!SUPPORTED_LOCALES.includes(activeLocale)) {
    console.error(`[RootLayout] Locale from getLocale() "${activeLocale}" is not in SUPPORTED_LOCALES. Critical error. Triggering notFound().`);
    notFound();
  }
  
  // 4. Carrega as mensagens para a localidade ativa
  let messages;
  try {
    // Chama getMessages() sem argumentos, confiando no contexto estabelecido por getLocale()
    messages = await getMessages(); 
    console.log(`[RootLayout] Successfully fetched messages for activeLocale (determined by getLocale()): "${activeLocale}"`);
  } catch (error) {
    console.error(`[RootLayout] Critical error fetching messages for locale "${activeLocale}":`, error);
    // Se getMessages falhar, o erro "Couldn't find next-intl config file" também pode originar aqui.
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
