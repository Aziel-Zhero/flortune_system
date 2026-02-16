// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { AuthProvider } from "@/contexts/auth-context";
import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Flortune - Seu Jardineiro Financeiro',
  description: 'Cultive suas finanças com o Flortune. Acompanhe, analise e faça seu patrimônio crescer com insights inteligentes e ferramentas intuitivas.',
  icons: {
    icon: '/Logo.png', 
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body 
        className={cn(
          "font-body antialiased",
          inter.variable,
          poppins.variable
        )} 
        suppressHydrationWarning
      >
        <AuthProvider>
          <AppSettingsProvider>
            {children}
            <Toaster />
          </AppSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
