
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
// import { signIn as nextAuthSignIn } from '@/app/api/auth/[...nextauth]/route'; // Não é usado diretamente para credenciais
import { supabase } from '@/lib/supabase/client'; // Usa o cliente Supabase padrão (anon key)
import bcrypt from 'bcryptjs';
import type { Profile } from "@/types/database.types";
import { v4 as uuidv4 } from 'uuid';

// Esquemas de validação Zod
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
        return rgCleaned.length >= 5 && rgCleaned.length <= 10; // Ajustado para um range mais comum
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
  console.log("[SignupUser Action] Iniciando processo de cadastro...");
  try {
    const rawData = Object.fromEntries(formData.entries());
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

    // 1. Verificar se o email já existe em `public.profiles`
    console.log(`[SignupUser Action] Verificando se email ${email} já existe em public.profiles...`);
    const { data: existingProfileByEmail, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle(); 

    if (fetchError) {
      console.error("[SignupUser Action] Erro ao verificar perfil existente:", fetchError.message);
      return { message: `Erro no banco de dados ao verificar email: ${fetchError.message}`, success: false, errors: {_form: [fetchError.message]} };
    }

    if (existingProfileByEmail) {
      console.log("[SignupUser Action] Email já registrado.");
      return {
        errors: { email: ["Este email já está registrado."] },
        message: "Este email já está registrado. Tente fazer login ou use outro email.",
        success: false,
      };
    }

    console.log("[SignupUser Action] Email disponível. Criando novo usuário...");

    // 2. Usar o método de signup do Supabase Auth que também insere na tabela auth.users
    // A chave do Supabase client aqui é a anon key, que tem permissão para signup.
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          display_name: displayName,
          phone: phone ? phone.replace(/\D/g, '') : null,
          cpf_cnpj: (accountType === 'pessoa' && cpf) ? cpf.replace(/\D/g, '') : (accountType === 'empresa' && cnpj) ? cnpj.replace(/\D/g, '') : null,
          rg: (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null,
          avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
          account_type: accountType,
        },
      },
    });

    if (signupError) {
      console.error("[SignupUser Action] Erro durante o Supabase Auth signUp:", signupError);
      return { message: signupError.message, success: false, errors: { _form: [signupError.message] }};
    }
    
    if (!authData.user) {
        console.error("[SignupUser Action] Supabase Auth signUp não retornou um usuário.");
        return { message: "Falha ao criar usuário, tente novamente.", success: false, errors: { _form: ["Ocorreu um erro desconhecido durante o cadastro."] }};
    }

    // O trigger `handle_new_user_from_next_auth` irá lidar com a criação do perfil em `public.profiles`
    // quando o registro for adicionado em `next_auth.users`.
    // Como o signUp do Supabase cria em `auth.users`, o trigger `on_auth_user_created`
    // cuidará de popular `public.profiles`. O adapter do NextAuth cuidará de `next_auth.users`.
    
    // A verificação acima já é uma boa medida. A lógica completa de criação de perfil
    // agora será delegada ao trigger do banco de dados para garantir consistência.

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
