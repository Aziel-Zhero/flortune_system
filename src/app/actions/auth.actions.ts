
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Usa o cliente Supabase padrão (anon key)
import bcrypt from 'bcryptjs';
import type { Profile } from "@/types/database.types";
import { v4 as uuidv4 } from 'uuid'; // Para gerar um ID consistente

// Esquemas de validação Zod (sem alterações)
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
  console.log("[SignupUser Action] Iniciando novo fluxo de cadastro...");
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
    console.log(`[SignupUser Action] Verificando se email ${email} já existe...`);
    const { data: existingProfileByEmail, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle(); 

    if (fetchError) {
      console.error("[SignupUser Action] Erro ao verificar perfil existente:", fetchError.message);
      return { message: `Erro no banco de dados: ${fetchError.message}`, success: false, errors: {_form: [fetchError.message]} };
    }

    if (existingProfileByEmail) {
      console.log("[SignupUser Action] Email já registrado.");
      return {
        errors: { email: ["Este email já está registrado."] },
        message: "Este email já está registrado. Tente fazer login ou use outro email.",
        success: false,
      };
    }

    console.log("[SignupUser Action] Email disponível. Processando novo usuário...");

    // 2. Gerar ID e hashear a senha ANTES de inserir no banco
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Criar o novo perfil na tabela `public.profiles`
    const newProfileData: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: userId,
        full_name: fullName,
        display_name: displayName,
        email: email,
        hashed_password: hashedPassword,
        phone: phone ? phone.replace(/\D/g, '') : null,
        cpf_cnpj: (accountType === 'pessoa' && cpf) ? cpf.replace(/\D/g, '') : (accountType === 'empresa' && cnpj) ? cnpj.replace(/\D/g, '') : null,
        rg: (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null,
        avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
        account_type: accountType,
    };
    
    console.log(`[SignupUser Action] Inserindo perfil com ID ${userId} em public.profiles...`);
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(newProfileData);

    if (insertError) {
      console.error("[SignupUser Action] Erro ao inserir perfil na tabela 'profiles':", insertError);
      return { message: `Falha ao registrar perfil: ${insertError.message}`, success: false, errors: { _form: [insertError.message] }};
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
