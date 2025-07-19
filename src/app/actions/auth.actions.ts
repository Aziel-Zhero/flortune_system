
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; 
import bcrypt from 'bcryptjs';
import type { Profile } from "@/types/database.types";
import { v4 as uuidv4 } from 'uuid';

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
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseUrl.startsWith('http')) {
    const errorMsg = "Serviço de autenticação indisponível. Configuração do servidor incompleta.";
    console.error(errorMsg);
    return { message: errorMsg, success: false, errors: { _form: [errorMsg] } };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

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

    // 1. Verificar se o email já existe em `auth.users`
    console.log(`[SignupUser Action] Verificando se email ${email} já existe em auth.users...`);
    const { data: existingUser, error: fetchUserError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (fetchUserError) {
      console.error("[SignupUser Action] Erro ao verificar usuário existente em auth.users:", fetchUserError.message);
      return { message: `Erro no banco de dados: ${fetchUserError.message}`, success: false, errors: {_form: [fetchUserError.message]} };
    }

    if (existingUser) {
      console.log("[SignupUser Action] Email já registrado em auth.users.");
      return {
        errors: { email: ["Este email já está registrado."] },
        message: "Este email já está registrado. Tente fazer login ou use outro email.",
        success: false,
      };
    }
    
    console.log("[SignupUser Action] Email disponível. Processando novo usuário...");

    // 2. Gerar ID e hashear a senha
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarUrl = `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`;

    // 3. Inserir na tabela `auth.users`
    console.log(`[SignupUser Action] Inserindo usuário com ID ${userId} em auth.users...`);
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        id: userId,
        email: email,
        password: password, 
        email_confirm: true,
        user_metadata: {
            name: displayName,
            avatar_url: avatarUrl
        }
    });

    if (createUserError) {
      console.error("[SignupUser Action] Erro ao criar usuário em auth.users:", createUserError.message);
      return { message: `Falha ao criar usuário: ${createUserError.message}`, success: false, errors: { _form: [createUserError.message] }};
    }
    
    // 4. Inserir na tabela `public.profiles`
    const newProfileData: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: userId,
        full_name: fullName,
        display_name: displayName,
        email: email,
        hashed_password: hashedPassword,
        phone: phone ? phone.replace(/\D/g, '') : null,
        cpf_cnpj: (accountType === 'pessoa' && cpf) ? cpf.replace(/\D/g, '') : (accountType === 'empresa' && cnpj) ? cnpj.replace(/\D/g, '') : null,
        rg: (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null,
        avatar_url: avatarUrl,
        account_type: accountType,
    };
    
    console.log(`[SignupUser Action] Inserindo perfil com ID ${userId} em public.profiles...`);
    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert(newProfileData);

    if (insertProfileError) {
      console.error("[SignupUser Action] Erro ao inserir perfil na tabela 'profiles':", insertProfileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
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
