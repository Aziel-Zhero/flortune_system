
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Provider } from '@supabase/supabase-js';

const emailSchema = z.string().email({ message: "Endereço de email inválido." });
const passwordSchema = z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
  .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." })
  .regex(/[^a-zA-Z0-9]/, { message: "A senha deve conter pelo menos um caractere especial." });

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema, // Reutilizando o schema base, mas a validação completa é mais para o cadastro
});

const signupSchemaBase = z.object({
  fullName: z.string().min(2, { message: "O nome completo/razão social deve ter pelo menos 2 caracteres." }),
  displayName: z.string().min(2, { message: "O nome de exibição/fantasia deve ter pelo menos 2 caracteres." }),
  phone: z.string().optional(), // Será refinado para ser obrigatório para empresa
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  accountType: z.enum(['pessoa', 'empresa'], { required_error: "Selecione o tipo de conta." }),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  rg: z.string().optional(),
});

const signupSchema = signupSchemaBase.refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})
.refine(data => { // CPF opcional para pessoa física
    if (data.accountType === 'pessoa' && data.cpf) {
      return data.cpf.replace(/\D/g, '').length === 11;
    }
    return true;
  }, {
    message: "Se fornecido, o CPF deve ser válido.",
    path: ["cpf"],
})
.refine(data => { // CNPJ obrigatório e válido para pessoa jurídica
    if (data.accountType === 'empresa') {
      return !!data.cnpj && data.cnpj.replace(/\D/g, '').length === 14;
    }
    return true;
  }, {
    message: "CNPJ é obrigatório e deve ser válido para pessoa jurídica.",
    path: ["cnpj"],
})
.refine(data => { // Telefone obrigatório para pessoa jurídica
    if (data.accountType === 'empresa') {
        return !!data.phone && data.phone.trim() !== '';
    }
    return true;
}, {
    message: "Telefone é obrigatório para pessoa jurídica.",
    path: ["phone"],
})
.refine(data => { // RG opcional, mas se fornecido, deve ter um formato aceitável
    if (data.accountType === 'pessoa' && data.rg) {
        // Validação simples de RG: permite dígitos e X, e um tamanho mínimo.
        // A máscara no frontend já ajuda a formatar.
        const rgCleaned = data.rg.replace(/\D/g, '');
        return rgCleaned.length >= 5 && rgCleaned.length <= 9; // Exemplo de tamanho, ajuste conforme necessidade
    }
    return true;
}, {
    message: "Se fornecido, o RG deve ser válido.",
    path: ["rg"],
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
    
    const { email, password } = validatedFields.data;
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return {
        message: error.message || "Falha no login. Verifique suas credenciais.",
        errors: { _form: [error.message || "Falha no login. Verifique suas credenciais."] },
        success: false,
      };
    }
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
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    accountType?: string[];
    cpf?: string[];
    cnpj?: string[];
    rg?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
 try {
    const rawData = Object.fromEntries(formData.entries());
    // Convert empty strings from optional fields to undefined so Zod treats them as optional
    if (rawData.cpf === '') rawData.cpf = undefined;
    if (rawData.cnpj === '') rawData.cnpj = undefined;
    if (rawData.rg === '') rawData.rg = undefined;
    if (rawData.phone === '') rawData.phone = undefined;
    
    const validatedFields = signupSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos. Por favor, verifique seus dados.",
        success: false,
      };
    }

    const { email, password, fullName, displayName, phone, accountType, cpf, cnpj, rg } = validatedFields.data;

    let cpfCnpjValue: string | null = null;
    if (accountType === 'pessoa' && cpf) {
      cpfCnpjValue = cpf.replace(/\D/g, ''); 
    } else if (accountType === 'empresa' && cnpj) {
      cpfCnpjValue = cnpj.replace(/\D/g, ''); 
    }

    const rgValue = (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName,
          display_name: displayName,
          phone: phone || null, 
          cpf_cnpj: cpfCnpjValue,
          rg: rgValue,
          avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
        },
      },
    });

    if (error) {
      // Adicionar verificação específica para "Invalid API key" para dar uma mensagem mais útil
      if (error.message.toLowerCase().includes("invalid api key") || error.message.toLowerCase().includes("failed to fetch")) {
         return {
            message: "Falha na comunicação com o servidor de autenticação. Verifique sua conexão e as configurações de API do Supabase.",
            errors: { _form: ["Erro de configuração ou conexão com o serviço de autenticação."] },
            success: false,
        };
      }
      return {
        message: error.message || "Falha ao criar conta.",
        errors: { _form: [error.message || "Falha ao criar conta."] },
        success: false,
      };
    }

    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
      return {
          message: "Este email já está registrado ou ocorreu um problema. Se você já se cadastrou, verifique seu email para confirmação ou tente fazer login.",
          errors: { email: ["Email já registrado ou necessita confirmação."] },
          success: false,
      };
    }
    
    if (signUpData.session === null && signUpData.user) {
        redirect('/login?signup=success_email_confirmation');
    } else {
        redirect('/dashboard');
    }

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Signup User Action Error:", error);
     if (typeof error.message === 'string' && (error.message.toLowerCase().includes("invalid api key") || error.message.toLowerCase().includes("failed to fetch"))) {
        return {
            message: "Falha na comunicação com o servidor de autenticação. Verifique sua conexão e as configurações de API do Supabase.",
            errors: { _form: ["Erro de configuração ou conexão com o serviço de autenticação."] },
            success: false,
        };
    }
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
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.url) {
      redirect(data.url); 
    } else {
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
    }
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("Logout User Action Error (catch):", error);
  }
  redirect('/login'); 
}

    