
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { signIn as nextAuthSignIn } from '@/app/api/auth/[...nextauth]/route';
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


// Tipos de estado para os formulários (se usar useActionState)
export type LoginFormState = { /* ... */ };
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
    _form?: string[]; // Para erros gerais do formulário
  };
  success?: boolean;
};

// A action de login (loginUser) não é mais chamada diretamente pelo form de login
// se o formulário usa signIn('credentials', {...}) do next-auth/react.
// O `authorize` do CredentialsProvider em [...nextauth]/route.ts cuidará da lógica de login.
// Pode ser mantida para outros usos ou removida se não for necessária.

export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  console.log("[SignupUser Action] Iniciando processo de cadastro...");
  try {
    const rawData = Object.fromEntries(formData.entries());
    // Limpa campos opcionais vazios para evitar problemas de validação Zod com strings vazias onde undefined é esperado
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
      console.error("[SignupUser Action] Erro ao verificar perfil existente em public.profiles (DB select):", fetchError);
      // *** MUDANÇA: MENSAGEM DE ERRO MAIS ESPECÍFICA ***
      return { message: "Não foi possível verificar os dados no banco. Verifique as permissões (RLS) da tabela 'profiles' para a role 'anon' e tente novamente.", success: false, errors: {_form: ["Erro de permissão no banco de dados ao verificar email."]} };
    }

    if (existingProfileByEmail) {
      console.log("[SignupUser Action] Email já registrado em public.profiles.");
      return {
        errors: { email: ["Este email já está registrado."] },
        message: "Este email já está registrado. Tente fazer login ou use outro email.",
        success: false,
      };
    }
    console.log("[SignupUser Action] Email não encontrado em public.profiles, prosseguindo com cadastro.");

    // 2. Preparar dados para o novo perfil
    const profileId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    let cpfCnpjValue: string | null = null;
    if (accountType === 'pessoa' && cpf) cpfCnpjValue = cpf.replace(/\D/g, ''); 
    else if (accountType === 'empresa' && cnpj) cpfCnpjValue = cnpj.replace(/\D/g, ''); 

    const rgValue = (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null;
    const phoneValue = phone ? phone.replace(/\D/g, '') : null;
    
    const newProfileData: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: profileId,
        full_name: fullName,
        display_name: displayName,
        email: email,
        hashed_password: hashedPassword,
        phone: phoneValue,
        cpf_cnpj: cpfCnpjValue,
        rg: rgValue,
        avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
        account_type: accountType,
    };
    
    // 3. Inserir o novo perfil na tabela `public.profiles`
    console.log("[SignupUser Action] Tentando inserir novo perfil em public.profiles com ID:", profileId);
    const { data: createdProfile, error: insertProfileError } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select('id, email')
        .single();

    if (insertProfileError) {
        console.error("[SignupUser Action] Erro ao criar perfil em public.profiles:", insertProfileError);
        if (insertProfileError.code === '23505') { 
             return { message: "Este email ou CPF/CNPJ já está registrado.", success: false, errors: {email: ["Email ou CPF/CNPJ já registrado."] }};
        }
        return { message: `Falha ao criar conta (DB insert profile): ${insertProfileError.message}.`, success: false, errors: {_form: [insertProfileError.message]} };
    }
    
    if (!createdProfile) {
        console.error("[SignupUser Action] Falha ao criar perfil em public.profiles após inserção (nenhum dado retornado).");
        return { message: "Falha ao criar perfil. Tente novamente.", success: false, errors: {_form: ["Erro desconhecido ao criar perfil."]} };
    }

    console.log("[SignupUser Action] Perfil criado com sucesso em public.profiles com ID:", createdProfile.id);
    
    // 4. Inserir o usuário na tabela `next_auth.users`
    // Esta etapa é crucial para que o NextAuth.js reconheça o usuário.
    // O trigger fará a sincronização reversa se necessário, mas para o fluxo de credenciais, é melhor ser explícito.
    console.log("[SignupUser Action] Tentando inserir usuário em next_auth.users para vincular conta...");
    const { error: insertAuthUserError } = await supabase
      .from('next_auth_users') // Nome da tabela como definido no adapter
      .insert({
        id: profileId,
        email: email,
        name: displayName,
        image: newProfileData.avatar_url,
      });

    if (insertAuthUserError) {
      console.error("[SignupUser Action] Erro ao criar usuário em next_auth.users:", insertAuthUserError);
      // Aqui, temos um problema: o perfil foi criado mas a conta de autenticação não.
      // Seria ideal ter uma transação para reverter a criação do perfil. Por simplicidade,
      // vamos notificar e pedir para tentar novamente, sabendo que o email agora estará bloqueado.
      return { message: "Ocorreu um erro ao vincular a conta. Por favor, contate o suporte.", success: false, errors: {_form: ["Falha na vinculação da conta de autenticação."]} };
    }

    console.log("[SignupUser Action] Cadastro completo e bem-sucedido. Redirecionando para login.");
    redirect('/login?signup=success'); 

  } catch (error: any) {
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error; 
    }
    console.error("[SignupUser Action] Erro inesperado durante o cadastro:", error);
    return {
      message: "Ocorreu um erro inesperado durante o cadastro. Tente novamente.",
      errors: { _form: [error.message || "Falha no cadastro devido a um erro no servidor."] },
      success: false,
    };
  }
}
