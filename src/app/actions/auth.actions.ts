
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Provider } from '@supabase/supabase-js';

const emailSchema = z.string().email({ message: "Endereço de email inválido." });
const passwordSchema = z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." });

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "O nome completo deve ter pelo menos 2 caracteres." }),
  displayName: z.string().min(2, { message: "O nome de exibição deve ter pelo menos 2 caracteres." }),
  phone: z.string().optional(), // Opcional por enquanto
  cpfCnpj: z.string().optional(), // Opcional
  rg: z.string().optional(), // Opcional
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
    _form?: string[]; // Erros gerais do formulário
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
    
    const { email, password } = validatedFields.data;
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return {
        message: error.message || "Falha no login. Verifique suas credenciais.",
        errors: { _form: [error.message || "Falha no login. Verifique suas credenciais."] },
        success: false,
      };
    }
    // O redirecionamento após login/signup bem-sucedido será tratado pelo middleware
    // ou por uma verificação no lado do cliente que monitora o estado de autenticação.
    // Server Actions não devem redirecionar diretamente em fluxos de useActionState
    // a menos que seja o último passo após um sucesso definitivo e sem necessidade de feedback no form.
    // Aqui, é melhor deixar o middleware/cliente lidar com isso.
    // Para forçar o redirecionamento se tudo der certo no Supabase:
    redirect('/dashboard');

  } catch (error: any) {
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
    fullName?: string[];
    displayName?: string[];
    phone?: string[];
    cpfCnpj?: string[];
    rg?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
 try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = signupSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos. Por favor, verifique seus dados.",
        success: false,
      };
    }

    const { email, password, fullName, displayName, phone, cpfCnpj, rg } = validatedFields.data;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Estes dados serão usados pela trigger handle_new_user para popular a tabela 'profiles'
        data: { 
          full_name: fullName,
          display_name: displayName,
          phone: phone || null, // Envia null se vazio
          cpf_cnpj: cpfCnpj || null,
          rg: rg || null,
          avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`, // Placeholder avatar
        },
      },
    });

    if (error) {
      return {
        message: error.message || "Falha ao criar conta.",
        errors: { _form: [error.message || "Falha ao criar conta."] },
        success: false,
      };
    }

    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
      // Email já existe, mas não confirmado, ou outro problema
      return {
          message: "Este email já está registrado ou ocorreu um problema. Se você já se cadastrou, verifique seu email para confirmação ou tente fazer login.",
          errors: { email: ["Email já registrado ou necessita confirmação."] },
          success: false,
      };
    }
    
    // Se o Supabase requer confirmação por email (configuração padrão)
    // O usuário não será logado imediatamente.
    // Redirecionar para login com uma mensagem para verificar o email.
    if (signUpData.session === null && signUpData.user) {
        redirect('/login?signup=success_email_confirmation');
    } else {
        // Se o usuário é logado automaticamente (confirmação de email desabilitada no Supabase)
        redirect('/dashboard');
    }

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

export async function signInWithOAuth(provider: Provider) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003'}/auth/callback`
      }
    });

    if (error) {
      console.error(`Google Sign In Action Error: ${error.message}`);
      // Normalmente, o redirecionamento para o Google acontece antes,
      // então este erro seria para problemas na chamada inicial.
      // Redirecionar para uma página de erro ou login com mensagem.
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.url) {
      redirect(data.url); // Redireciona para a página de consentimento do Google
    } else {
      // Caso inesperado onde não há URL mas também não há erro.
      return redirect('/login?error=oauth_url_missing');
    }

  } catch (error: any) {
     if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Google Sign In Action Error (catch):", error);
    return redirect(`/login?error=oauth_exception`);
  }
}

export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout User Action Error:", error);
      // Mesmo com erro, tentamos redirecionar. O usuário pode querer sair de qualquer jeito.
    }
  } catch (error: any) {
    // Se o erro for de redirect, ele será lançado pelo middleware se necessário.
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Logout User Action Error (catch):", error);
  }
  redirect('/login'); // Sempre redireciona para o login após a tentativa de logout.
}
