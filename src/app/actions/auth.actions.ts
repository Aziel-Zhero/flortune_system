// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from 'next-auth';
import { supabaseAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";

// --- Login de Usuário ---
const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function loginUser(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  try {
    await signIn('credentials', { 
      ...Object.fromEntries(formData),
      redirectTo: '/dashboard'
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Credenciais inválidas.' };
        default:
          return { message: 'Ocorreu um erro durante o login.' };
      }
    }
    throw error;
  }
}

// --- Cadastro de Usuário ---
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


export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const validatedFields = signupFormSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Existem erros no formulário.",
    };
  }
  
  if (!supabaseAdmin) {
    return { message: "Serviço de autenticação indisponível." };
  }
  
  const origin = headers().get('origin');
  
  const { data: validatedData } = validatedFields;
  
  const { data, error } = await supabaseAdmin.auth.signUp({
    email: validatedData.email,
    password: validatedData.password,
    options: {
      // O email de confirmação será enviado para esta URL
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: {
        full_name: validatedData.fullName,
        display_name: validatedData.displayName,
        account_type: validatedData.accountType,
        cpf_cnpj: validatedData.accountType === 'pessoa' ? validatedData.cpf : validatedData.cnpj,
        rg: validatedData.rg,
        // Garante que o gatilho no banco não precise de um `hashed_password`
        // A senha real é tratada com segurança pelo Supabase Auth.
      }
    }
  });

  if (error) {
    if (error.message.includes("User already registered")) {
      return { message: "Este e-mail já está cadastrado. Tente fazer login." };
    }
    console.error("Supabase signup error:", error);
    return { message: error.message || "Ocorreu um erro ao criar a conta." };
  }

  if (!data.session && data.user) {
    // Caso a confirmação de e-mail esteja ativada, o usuário é criado mas não há sessão.
    // Este é o cenário de sucesso esperado.
    return { success: true, message: "Cadastro realizado! Verifique seu e-mail." };
  }

  return { success: true };
}
