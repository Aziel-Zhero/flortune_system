"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';

const emailSchema = z.string().email({ message: "Endereço de email inválido." });
const passwordSchema = z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." });

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});


export type LoginFormState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[]; 
  };
  success?: boolean;
};

export async function loginUser(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Campos inválidos. Por favor, verifique seus dados.",
      success: false,
    };
  }
  
  // Simula chamada de API
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Redireciona para o dashboard (sem prefixo de localidade)
  redirect('/dashboard'); 
}

export type SignupFormState = {
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Campos inválidos. Por favor, verifique seus dados.",
      success: false,
    };
  }

  // Simula chamada de API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simula sucesso e redireciona para a página de login com um parâmetro de sucesso
  redirect('/login?signup=success'); 
}

export async function signInWithGoogle() {
  console.log("Tentando login com Google...");
  await new Promise(resolve => setTimeout(resolve, 500));
  redirect('/dashboard'); 
}

export async function logoutUser() {
  console.log("Deslogando usuário (server action)...");
  // Limpar sessão/cookie aqui em um app real
  redirect('/login'); 
}
