
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; 
import bcrypt from 'bcryptjs';
import type { Profile } from "@/types/database.types";

const emailSchema = z.string().email({ message: "Endereço de email inválido." });
const passwordSchema = z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
  .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." })
  .regex(/[^a-zA-Z0-9]/, { message: "A senha deve conter pelo menos um caractere especial." });

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
        return !!data.phone && data.phone.trim() !== '' && data.phone.replace(/\D/g, '').length >= 10;
    }
    return true;
}, {
    message: "Telefone é obrigatório e deve ser válido para pessoa jurídica.",
    path: ["phone"],
})
.refine(data => {
    if (data.accountType === 'pessoa' && data.rg) {
        const rgCleaned = data.rg.replace(/[^0-9Xx]/gi, '');
        return rgCleaned.length >= 5 && rgCleaned.length <= 10;
    }
    return true;
}, {
    message: "Se fornecido, o RG deve ser válido.",
    path: ["rg"],
});


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
  console.log("[SignupUser Action] Iniciando novo fluxo de cadastro unificado...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    const errorMsg = "Serviço de autenticação indisponível. Configuração do servidor incompleta.";
    console.error(errorMsg);
    return { message: errorMsg, success: false, errors: { _form: [errorMsg] } };
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const rawData = Object.fromEntries(formData.entries());
    
    // Normalização dos dados para validação
    if (rawData.cpf === '') rawData.cpf = undefined;
    if (rawData.cnpj === '') rawData.cnpj = undefined;
    if (rawData.rg === '') rawData.rg = undefined;
    if (rawData.phone === '') rawData.phone = undefined;
    
    const validatedFields = signupSchema.safeParse(rawData);

    if (!validatedFields.success) {
      console.error("[SignupUser Action] Validação Zod falhou:", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos. Por favor, verifique os dados inseridos.",
        success: false,
      };
    }

    const { email, password, fullName, displayName, phone, accountType, cpf, cnpj, rg } = validatedFields.data;

    // 1. Verificar se o email já existe na tabela de perfis (que é a nossa fonte da verdade)
    console.log(`[SignupUser Action] Verificando se email ${email} já existe...`);
    const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // Ignora erro 'not found'
        console.error("[SignupUser Action] Erro ao verificar perfil existente:", fetchError.message);
        return { message: `Erro no banco de dados: ${fetchError.message}`, success: false, errors: { _form: [fetchError.message] } };
    }

    if (existingProfile) {
        console.log("[SignupUser Action] Email já registrado.");
        return {
            errors: { email: ["Este email já está registrado."] },
            message: "Este email já está registrado. Tente fazer login ou use outro email.",
            success: false,
        };
    }
    
    console.log("[SignupUser Action] Email disponível. Processando novo usuário...");

    // 2. Criar o usuário no Supabase Auth. O NextAuth adapter irá então sincronizá-lo com as tabelas do next_auth.
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Metadados que o SupabaseAdapter pode usar para preencher a tabela `users`
        data: {
            full_name: fullName,
            display_name: displayName,
            avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
        },
      },
    });

    if (signUpError) {
        console.error("[SignupUser Action] Erro no Supabase signUp:", signUpError.message);
        return { message: `Falha ao criar usuário: ${signUpError.message}`, success: false, errors: { _form: [signUpError.message] } };
    }

    if (!authData.user) {
        console.error("[SignupUser Action] Supabase signUp não retornou um usuário.");
        return { message: "Ocorreu um erro inesperado e o usuário não foi criado.", success: false, errors: { _form: ["Falha ao obter dados do novo usuário."]}};
    }
    
    // 3. Inserir o perfil completo na nossa tabela `public.profiles`.
    // Esta etapa é crucial para que o login com 'Credentials' funcione e para ter todos os dados do usuário.
    const hashedPassword = await bcrypt.hash(password, 10);
    const newProfileData: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: authData.user.id,
        full_name: fullName,
        display_name: displayName,
        email: email,
        hashed_password: hashedPassword,
        phone: phone ? phone.replace(/\D/g, '') : null,
        cpf_cnpj: (accountType === 'pessoa' && cpf) ? cpf.replace(/\D/g, '') : (accountType === 'empresa' && cnpj) ? cnpj.replace(/\D/g, '') : null,
        rg: (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null,
        avatar_url: authData.user.user_metadata.avatar_url,
        account_type: accountType,
    };
    
    // Usando a service_role key para inserir o perfil, pois a RLS do usuário ainda não está ativa.
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert(newProfileData);

    if (insertProfileError) {
        console.error("[SignupUser Action] Erro ao inserir perfil na tabela 'profiles':", insertProfileError.message);
        // Tenta reverter a criação do usuário em auth.users
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.error("[SignupUser Action] Usuário de auth.users revertido devido a erro na inserção do perfil.");
        return { message: `Falha ao registrar perfil: ${insertProfileError.message}`, success: false, errors: { _form: [insertProfileError.message] }};
    }
    
    console.log("[SignupUser Action] Cadastro completo e bem-sucedido. Redirecionando para login.");
    redirect('/login?signup=success');

  } catch (error: any) {
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error; 
    }
    console.error("[SignupUser Action] Erro inesperado durante o cadastro:", error);
    return {
      message: "Ocorreu um erro inesperado. Tente novamente.",
      errors: { _form: [error.message || "Falha no cadastro."] },
      success: false,
    };
  }
}
