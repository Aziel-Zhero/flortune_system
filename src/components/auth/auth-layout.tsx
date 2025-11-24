// src/components/auth/auth-layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import Image from "next/image";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  footerLinkHref: string;
  footerLinkText: string;
  footerText: string;
}

export function AuthLayout({ 
  children, 
  title, 
  description, 
  footerLinkHref, 
  footerLinkText, 
  footerText 
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <Image src="/Logo.png" alt="Flortune Logo" width={36} height={36} style={{ height: 'auto' }} />
            <h1 className="text-4xl font-headline font-bold">{APP_NAME}</h1>
          </Link>
          <h2 className="mt-4 text-2xl font-semibold font-headline tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 shadow-lg sm:p-8">
          {children}
        </div>
        
        <p className="px-8 text-center text-sm text-muted-foreground">
          {footerText}{' '}
          <Link
            href={footerLinkHref}
            className="underline underline-offset-4 hover:text-primary"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
