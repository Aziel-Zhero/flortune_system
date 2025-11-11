// src/components/auth/oauth-button.tsx
"use client";
import { Button } from "@/components/ui/button";
import { signIn } from 'next-auth/react';
import { useSearchParams } from "next/navigation";

interface OAuthButtonProps {
  providerName: "Google"; // Limit to supported providers
  buttonText: string;
}

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.22c-.46 2.07-2.13 3.42-4.09 3.42a5.34 5.34 0 0 1-5.34-5.34a5.34 5.34 0 0 1 5.34-5.34c1.41 0 2.42.52 3.2 1.26l1.96-1.96A8.74 8.74 0 0 0 12.18 2a9.34 9.34 0 0 0-9.34 9.34a9.34 9.34 0 0 0 9.34 9.34c5.04 0 8.92-3.76 8.92-8.92c0-.61-.05-1.11-.15-1.56Z"/>
  </svg>
);

export function OAuthButton({ providerName, buttonText }: OAuthButtonProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSignIn = () => {
    signIn(providerName.toLowerCase(), { callbackUrl });
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleSignIn}>
      <GoogleIcon /> 
      {buttonText}
    </Button>
  );
}
