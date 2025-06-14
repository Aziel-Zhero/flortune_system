
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
  try {
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

    // Sucesso - redirecionar
    // O redirect() lança um erro especial que o Next.js trata.
    redirect('/dashboard'); 

  } catch (error: any) {
    // Se o erro for um erro de redirecionamento do Next.js, relance-o para que o Next.js possa lidar com ele.
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error("Login User Action Error:", error);
    return {
      message: "Ocorreu um erro inesperado durante o login. Tente novamente.",
      errors: { _form: ["Falha no login devido a um erro no servidor."] },
      success: false,
    };
  }
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
 try {
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
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Signup User Action Error:", error);
    return {
      message: "Ocorreu um erro inesperado durante o cadastro. Tente novamente.",
      errors: { _form: ["Falha no cadastro devido a um erro no servidor."] },
      success: false,
    };
  }
}

export async function signInWithGoogle() {
  try {
    console.log("Tentando login com Google...");
    await new Promise(resolve => setTimeout(resolve, 500));
    redirect('/dashboard');
  } catch (error: any) {
     if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Google Sign In Action Error:", error);
    // Para signInWithGoogle, se o redirect falhar de forma não padrão,
    // não há um 'prevState' para retornar um estado de erro da mesma forma.
    // A melhor abordagem aqui é deixar o Next.js lidar com o erro ou
    // redirecionar para uma página de erro.
    // Por ora, apenas logamos e o erro será propagado com uma mensagem genérica.
    throw new Error("Falha ao tentar login com Google. Ocorreu um erro no servidor.");
  }
}

export async function logoutUser() {
  try {
    console.log("Deslogando usuário (server action)...");
    // Limpar sessão/cookie aqui em um app real
    redirect('/login');
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Logout User Action Error:", error);
    throw new Error("Falha ao tentar sair. Ocorreu um erro no servidor.");
  }
}
