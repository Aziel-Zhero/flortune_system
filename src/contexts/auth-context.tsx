// src/contexts/auth-context.tsx
"use client"

import { SessionProvider, useSession as useNextAuthSession, signIn, signOut } from "next-auth/react";

// Re-exportando para evitar problemas de importação direta em outros lugares
const AuthProvider = SessionProvider;
const useSession = useNextAuthSession;

export { AuthProvider, useSession, signIn, signOut };
