// src/contexts/auth-context.tsx
"use client"

import { SessionProvider, useSession } from "next-auth/react";

const AuthProvider = SessionProvider;
export { AuthProvider, useSession };
