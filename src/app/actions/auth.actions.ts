
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
  password: z.string().min(1, { message: "A senha é obrigatória." }), // Senha não pode ser vazia, mas a validação de complexidade é mais para o cadastro
});

const signupSchemaBase = z.object({
  fullName: z.string().min(2, { message: "O nome completo/razão social deve ter pelo menos 2 caracteres." }),
  displayName: z.string().min(2, { message: "O nome de exibição/fantasia deve ter pelo menos 2 caracteres." }),
  phone: z.string().optional(),
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
.refine(data => {
    if (data.accountType === 'pessoa' && data.cpf) {
      const cpfCleaned = data.cpf.replace(/\D/g, '');
      return cpfCleaned.length === 11;
    }
    return true;
  }, {
    message: "Se fornecido, o CPF deve ser válido (11 dígitos).",
    path: ["cpf"],
})
.refine(data => {
    if (data.accountType === 'empresa') {
      return !!data.cnpj && data.cnpj.replace(/\D/g, '').length === 14;
    }
    return true;
  }, {
    message: "CNPJ é obrigatório e deve ser válido (14 dígitos) para pessoa jurídica.",
    path: ["cnpj"],
})
.refine(data => {
    if (data.accountType === 'empresa') {
        return !!data.phone && data.phone.trim() !== '' && data.phone.replace(/\D/g, '').length >= 10; // Validação simples de telefone
    }
    return true;
}, {
    message: "Telefone é obrigatório e deve ser válido para pessoa jurídica.",
    path: ["phone"],
})
.refine(data => {
    if (data.accountType === 'pessoa' && data.rg) {
        const rgCleaned = data.rg.replace(/[^0-9Xx]/gi, '');
        return rgCleaned.length >= 5 && rgCleaned.length <= 10; // Ajustado para um intervalo mais comum
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
  console.log("loginUser action: Iniciando processo de login...");
  try {
    const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      console.warn("loginUser action: Validação falhou.", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos. Por favor, verifique seus dados.",
        success: false,
      };
    }
    
    const { email, password } = validatedFields.data;
    console.log(`loginUser action: Tentando login para o email: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("loginUser action: Erro do Supabase ao tentar signInWithPassword:", error);
      let userMessage = "Falha no login. Verifique suas credenciais.";
      if (error.message.includes("Email not confirmed")) {
        userMessage = "Seu email ainda não foi confirmado. Por favor, verifique sua caixa de entrada.";
      } else if (error.message.includes("Invalid login credentials")) {
        userMessage = "Email ou senha inválidos. Por favor, tente novamente.";
      }
      return {
        message: userMessage,
        errors: { _form: [userMessage] },
        success: false,
      };
    }

    if (!data.session) {
        console.error("loginUser action: Login bem-sucedido (sem erro), mas NENHUMA SESSÃO retornada. Usuário:", data.user);
        return {
            message: "Login falhou em estabelecer uma sessão. Tente novamente ou contate o suporte.",
            errors: { _form: ["Não foi possível iniciar a sessão."] },
            success: false,
        };
    }
    
    console.log("loginUser action: Login bem-sucedido! Sessão:", data.session?.id, "Usuário:", data.user?.id);
    redirect('/dashboard');

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("loginUser action: Erro inesperado durante o login:", error);
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
  console.log("signupUser action: Iniciando processo de cadastro...");
 try {
    const rawData = Object.fromEntries(formData.entries());
    if (rawData.cpf === '') rawData.cpf = undefined;
    if (rawData.cnpj === '') rawData.cnpj = undefined;
    if (rawData.rg === '') rawData.rg = undefined;
    if (rawData.phone === '') rawData.phone = undefined;
    
    const validatedFields = signupSchema.safeParse(rawData);

    if (!validatedFields.success) {
      console.warn("signupUser action: Validação falhou.", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos. Por favor, verifique seus dados.",
        success: false,
      };
    }

    const { email, password, fullName, displayName, phone, accountType, cpf, cnpj, rg } = validatedFields.data;
    console.log(`signupUser action: Tentando cadastrar email: ${email}, Tipo de conta: ${accountType}`);

    let cpfCnpjValue: string | null = null;
    if (accountType === 'pessoa' && cpf) {
      cpfCnpjValue = cpf.replace(/\D/g, ''); 
    } else if (accountType === 'empresa' && cnpj) {
      cpfCnpjValue = cnpj.replace(/\D/g, ''); 
    }

    const rgValue = (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null;
    const phoneValue = phone ? phone.replace(/\D/g, '') : null;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName,
          display_name: displayName,
          phone: phoneValue, 
          cpf_cnpj: cpfCnpjValue,
          rg: rgValue,
          avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
        },
         emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003'}/auth/callback`,
      },
    });

    if (error) {
      console.error("signupUser action: Erro do Supabase ao tentar signUp:", error);
      if (error.message.toLowerCase().includes("invalid api key") || error.message.toLowerCase().includes("failed to fetch")) {
         return {
            message: "Falha na comunicação com o servidor de autenticação. Verifique sua conexão e as configurações de API do Supabase.",
            errors: { _form: ["Erro de configuração ou conexão com o serviço de autenticação."] },
            success: false,
        };
      }
      if (error.message.includes("User already registered")) {
         return {
            message: "Este email já está registrado. Tente fazer login ou recuperar sua senha.",
            errors: { email: ["Email já cadastrado."] },
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
      console.warn("signupUser action: Usuário criado, mas identities está vazio (pode indicar que o email já existe mas não confirmado).", signUpData.user);
      return {
          message: "Este email já está registrado ou ocorreu um problema. Se você já se cadastrou, verifique seu email para confirmação ou tente fazer login.",
          errors: { email: ["Email já registrado ou necessita confirmação."] },
          success: false,
      };
    }
    
    if (signUpData.user && !signUpData.session) {
        // Isso é esperado se a confirmação de email estiver habilitada
        console.log("signupUser action: Cadastro bem-sucedido! Usuário criado, aguardando confirmação de email. ID do usuário:", signUpData.user.id);
        redirect('/login?signup=success_email_confirmation');
    } else if (signUpData.user && signUpData.session) {
        // Isso é esperado se a confirmação de email estiver DESABILITADA
        console.log("signupUser action: Cadastro e login bem-sucedidos (sem confirmação de email)! ID do usuário:", signUpData.user.id, "ID da sessão:", signUpData.session.id);
        redirect('/dashboard');
    } else {
        console.error("signupUser action: Situação inesperada após signUp. Nenhum usuário ou sessão.", signUpData);
         return {
            message: "Ocorreu uma situação inesperada durante o cadastro. Tente novamente.",
            errors: { _form: ["Falha no cadastro."] },
            success: false,
        };
    }

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("signupUser action: Erro inesperado durante o cadastro:", error);
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
  console.log(`signInWithOAuth action: Tentando login com ${provider}...`);
  const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003'}/auth/callback`;
  console.log(`signInWithOAuth action: Redirecionando para: ${redirectTo}`);
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      }
    });

    if (error) {
      console.error(`signInWithOAuth action: Erro do Supabase com ${provider}:`, error);
      return redirect(`/login?error=${encodeURIComponent(`Falha ao autenticar com ${provider}: ${error.message}`)}`);
    }

    if (data.url) {
      console.log(`signInWithOAuth action: URL de redirecionamento OAuth de ${provider} obtida: ${data.url}`);
      redirect(data.url); 
    } else {
      console.error(`signInWithOAuth action: Nenhuma URL de redirecionamento OAuth de ${provider} retornada.`);
      return redirect(`/login?error=oauth_url_missing&provider=${provider}`);
    }

  } catch (error: any) {
     if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error(`signInWithOAuth action: Erro inesperado com ${provider}:`, error);
    return redirect(`/login?error=oauth_exception&provider=${provider}`);
  }
}

export async function logoutUser() {
  console.log("logoutUser action: Iniciando processo de logout...");
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("logoutUser action: Erro do Supabase ao tentar signOut:", error);
    } else {
      console.log("logoutUser action: Logout bem-sucedido.");
    }
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("logoutUser action: Erro inesperado durante o logout:", error);
  }
  redirect('/login?logout=success'); 
}
    
