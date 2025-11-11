// src/contexts/auth-context.tsx
"use client"

import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

// Re-exportando para evitar problemas de importação direta em outros lugares
const AuthProvider = SessionProvider;

export { AuthProvider, useSession, signIn, signOut };
