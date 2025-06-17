
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
  // session?: any; // Opcional se você estiver passando a sessão inicial do servidor
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
    // basePath="/api/auth" // O padrão já é este, mas pode ser explícito
    // refetchInterval={5 * 60} // Opcional: Refetch session every 5 minutes
    // refetchOnWindowFocus={true} // Opcional: Refetch session on window focus
    >
      {children}
    </NextAuthSessionProvider>
  );
}
