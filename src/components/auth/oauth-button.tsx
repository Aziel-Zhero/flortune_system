// src/components/auth/oauth-button.tsx
"use client";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { type Provider } from '@supabase/supabase-js';

interface OAuthButtonProps {
  provider: Provider;
  buttonText: string;
}

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.22c-.46 2.07-2.13 3.42-4.09 3.42a5.34 5.34 0 0 1-5.34-5.34a5.34 5.34 0 0 1 5.34-5.34c1.41 0 2.42.52 3.2 1.26l1.96-1.96A8.74 8.74 0 0 0 12.18 2a9.34 9.34 0 0 0-9.34 9.34a9.34 9.34 0 0 0 9.34 9.34c5.04 0 8.92-3.76 8.92-8.92c0-.61-.05-1.11-.15-1.56Z"/>
  </svg>
);

const GitHubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
        <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.9-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.9 1.52 2.34 1.08 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.94c0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02a3.6 3.6 0 0 1 .1 2.64c.64.7 1.03 1.6 1.03 2.69c0 3.84-2.34 4.68-4.57 4.93c.36.31.68.92.68 1.85v2.73c0 .27.18.57.69.48A10 10 0 0 0 12 2"/>
    </svg>
);


export function OAuthButton({ provider, buttonText }: OAuthButtonProps) {
  const handleSignIn = async () => {
    if (!supabase) {
        console.error("Supabase client is not available.");
        return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
        // PKCE (Proof Key for Code Exchange) é um fluxo de segurança que pode
        // causar problemas em localhost. Desativá-lo para desenvolvimento é uma prática comum.
        skipBrowserRedirect: false, 
      },
    });
  };

  const renderIcon = () => {
      switch(provider) {
          case 'google':
              return <GoogleIcon />;
          case 'github':
              return <GitHubIcon />;
          default:
              return null;
      }
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleSignIn}>
      {renderIcon()}
      {buttonText}
    </Button>
  );
}
