import type { Metadata } from 'next';
import { AppSettingsProvider } from '@/contexts/app-settings-context';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';

export const metadata: Metadata = {
  title: 'Flortune - Your Financial Gardener',
  description: 'Cultivate your finances with Flortune. Track, analyze, and grow your wealth with smart insights and intuitive tools.',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppSettingsProvider>
          {children}
          <Toaster />
        </AppSettingsProvider>
      </body>
    </html>
  );
}
