
import type { Metadata } from 'next';
import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { SessionProvider } from '@/components/auth/session-provider'; 
import { Toaster } from "@/components/ui/toaster";
import './globals.css'; 
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Flortune - Seu Jardineiro Financeiro',
  description: 'Cultive suas finanças com o Flortune. Acompanhe, analise e faça seu patrimônio crescer com insights inteligentes e ferramentas intuitivas.',
  icons: {
    icon: '/icon.svg', 
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <Suspense fallback={<div>Carregando...</div>}>
          <AppSettingsProvider>
            <SessionProvider> 
              {children}
              <Toaster />
            </SessionProvider>
          </AppSettingsProvider>
        </Suspense>
      </body>
    </html>
  );
}
