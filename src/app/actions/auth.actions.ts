// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';

// --- Esquema de Login Unificado ---
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
};

export async function loginUser(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const supabase = createClient();
  
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Dados inválidos.",
    };
  }
  
  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase login error:", error.message);
    if (error.message.includes("Invalid login credentials")) {
        return { message: "Credenciais inválidas. Verifique seu e-mail e senha." };
    }
    return { message: "Ocorreu um erro durante o login. Tente novamente." };
  }

  // Se o login for bem-sucedido, precisamos verificar o 'role' para redirecionar.
  // Usamos o Service Role Client aqui para buscar o perfil de forma segura no servidor.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', email)
    .single();

  if (profileError) {
    console.error("Error fetching profile role:", profileError.message);
    // Redireciona para o dashboard padrão como fallback
    return redirect('/dashboard');
  }

  if (profile?.role === 'admin') {
    return redirect('/dashboard-admin');
  }
  
  return redirect('/dashboard');
}


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


export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const supabase = createClient();
  const origin = headers().get('origin');
  
  const validatedFields = signupFormSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Existem erros no formulário.",
    };
  }
  
  const { data: validatedData } = validatedFields;
  
  const { error } = await supabase.auth.signUp({
    email: validatedData.email,
    password: validatedData.password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: {
        full_name: validatedData.fullName,
        display_name: validatedData.displayName,
        account_type: validatedData.accountType,
        cpf_cnpj: validatedData.accountType === 'pessoa' ? validatedData.cpf : validatedData.cnpj,
        rg: validatedData.rg,
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

  return redirect('/login?signup=success');
}
