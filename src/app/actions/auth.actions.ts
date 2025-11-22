// src/app/actions/auth.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// Esta Server Action foi descontinuada em favor da autenticação direta
// no lado do cliente para evitar erros 502 em ambientes de produção específicos.
// A lógica agora reside em `src/components/auth/login-form.tsx` e `signup-form.tsx`.

export async function loginUser(prevState: any, formData: FormData): Promise<{ error?: string; redirectTo?: string; success?: boolean; }> {
  console.log("loginUser Server Action is deprecated.");
  return { error: "This function is deprecated." };
}

export async function signupUser(formData: FormData) {
  console.log("signupUser Server Action is deprecated.");
  return redirect('/signup?error=deprecated_function');
}
