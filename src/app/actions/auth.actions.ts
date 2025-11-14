// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';


// --- Esquema de Cadastro de Usuário ---
const signupFormSchema = z.object({
  fullName: z.string().min(2, { message: "O nome completo é obrigatório." }),
  displayName: z.string().min(2, { message: "O nome de exibição é obrigatório." }),
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(8, { message: "A senha precisa ter no mínimo 8 caracteres." }),
  accountType: z.enum(['pessoa', 'empresa']),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  rg: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos."
  })
});

export type SignupFormState = {
  message?: string;
  errors?: {
    fullName?: string[];
    displayName?: string[];
    email?: string[];
    password?: string[];
    terms?: string[];
    _form?: string[];
  };
  success?: boolean;
};

// Esta função agora é chamada apenas no servidor.
// O fluxo principal de signup (com senha) será feito no cliente.
export async function signupUserWithOAuth(provider: 'google') {
  const origin = headers().get('origin');
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    console.error('OAuth sign in error:', error);
    return redirect('/login?error=oauth_failed');
  }

  return redirect(data.url);
}

// A função de login com senha foi movida para o lado do cliente (login-form.tsx)
// A função de cadastro com senha foi movida para o lado do cliente (signup-form.tsx)
// Mantendo este arquivo caso futuras server actions de auth sejam necessárias.
