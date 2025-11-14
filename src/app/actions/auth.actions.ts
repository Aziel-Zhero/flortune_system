// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { signIn } from "@/lib/auth";
import { AuthError } from 'next-auth';
import { supabaseAdmin } from "@/lib/supabase/admin";

// --- Login Schema ---
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
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Dados inválidos.",
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  try {
     // Primeiro, vamos descobrir a role do usuário para saber para onde redirecionar.
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('email', email)
        .single();
        
    const redirectTo = profile?.role === 'admin' ? '/dashboard-admin' : '/dashboard';

    await signIn('credentials', {
      email,
      password,
      redirectTo,
    });
    
    // Se chegar aqui, algo deu errado, mas o NextAuth deve lidar com o erro.
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Email ou senha inválidos.', success: false, errors: { _form: ['Credenciais inválidas.'] } };
        default:
          return { message: 'Ocorreu um erro durante o login.', success: false, errors: { _form: ['Algo deu errado.'] } };
      }
    }
    // Para o erro NEXT_REDIRECT
    throw error;
  }
}


// --- Signup Schema ---
const passwordSchema = z.string()
  .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
  .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." })
  .regex(/[^a-zA-Z0-9]/, { message: "A senha deve conter pelo menos um caractere especial." });

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "O nome completo deve ter pelo menos 2 caracteres." }),
  displayName: z.string().min(2, { message: "O nome de exibição deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: passwordSchema,
  phone: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos e condições."
  })
});


export type SignupFormState = {
  message?: string;
  errors?: {
    fullName?: string[];
    displayName?: string[];
    email?: string[];
    password?: string[];
    phone?: string[];
    cpf?: string[];
    rg?: string[];
    terms?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Dados de cadastro inválidos.",
      success: false,
    };
  }
  
  if (!supabaseAdmin) {
    return { message: "Serviço de autenticação indisponível.", success: false };
  }

  const { email, password, fullName, displayName, avatar_url } = validatedFields.data;

  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: displayName,
        avatar_url: avatar_url,
      },
    },
  });
  
  if (error) {
    if (error.message.includes("User already registered")) {
      return { message: "Este endereço de email já está em uso.", success: false, errors: { email: ["Email já cadastrado."] } };
    }
    return { message: `Erro no cadastro: ${error.message}`, success: false };
  }
  
  if (data.user && !data.user.identities?.length) {
    return { message: "Este usuário já existe, mas o email precisa ser confirmado.", success: false, errors: { email: ["Confirmação de email pendente."]}};
  }
  
  redirect('/login?signup=success');
}
