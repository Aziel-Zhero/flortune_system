// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from 'next-auth';

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
    await signIn('credentials', Object.fromEntries(formData));
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


// --- Login de Administrador ---
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function adminLogin(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const validatedFields = adminLoginSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return { message: "Dados inválidos." };
  }
  
  try {
    await signIn('admin-credentials', {
        ...validatedFields.data,
        redirectTo: '/dashboard-admin' // Redireciona para o painel admin
    });
    return { success: true };
  } catch (error) {
     if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Credenciais de administrador inválidas.' };
        default:
          return { message: 'Ocorreu um erro durante o login de administrador.' };
      }
    }
    throw error;
  }
}


// --- Cadastro de Usuário ---
const signupSchema = z.object({
  fullName: z.string().min(2, { message: "O nome completo é obrigatório." }),
  displayName: z.string().min(2, { message: "O nome de exibição é obrigatório." }),
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(8, { message: "A senha precisa ter no mínimo 8 caracteres." }),
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
  };
  success?: boolean;
};

export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  // Implementação de cadastro aqui, se necessário.
  // Por enquanto, o foco está no login.
  return { message: "Funcionalidade de cadastro ainda não implementada na Server Action." };
}
