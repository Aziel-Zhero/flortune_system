// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; 

const passwordSchema = z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." });

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "O nome completo é obrigatório." }),
  displayName: z.string().min(2, { message: "O nome de exibição é obrigatório." }),
  email: z.string().email({ message: "Email inválido." }),
  password: passwordSchema,
  accountType: z.enum(['pessoa', 'empresa']),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  cnpj: z.string().optional(),
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
    accountType?: string[];
    cpf?: string[];
    rg?: string[];
    cnpj?: string[];
    terms?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const errorMsg = "Serviço de autenticação indisponível.";
    return { message: errorMsg, success: false, errors: { _form: [errorMsg] } };
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const rawData = Object.fromEntries(formData.entries());
    const parsedData = {
      ...rawData,
      terms: rawData.terms === 'on',
    };
    const validatedFields = signupSchema.safeParse(parsedData);

    if (!validatedFields.success) {
      console.log(validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos. Por favor, verifique os dados inseridos.",
        success: false,
      };
    }

    const { email, password, fullName, displayName, accountType, cpf, rg, cnpj } = validatedFields.data;
    
    const userMetadata = {
        full_name: fullName,
        display_name: displayName,
        avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
        account_type: accountType,
        plan_id: 'tier-cultivador',
        has_seen_welcome_message: false,
        cpf_cnpj: accountType === 'pessoa' ? cpf : cnpj,
        rg: accountType === 'pessoa' ? rg : null,
    };
    
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata
      }
    });

    if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
            return { message: "Este email já está cadastrado.", success: false, errors: { email: ["Este email já está em uso."] } };
        }
        return { message: `Falha ao criar usuário: ${signUpError.message}`, success: false, errors: { _form: [signUpError.message] } };
    }

    if (!authData.user) {
        return { message: "Ocorreu um erro inesperado e o usuário não foi criado.", success: false, errors: { _form: ["Falha ao obter dados do novo usuário."]}};
    }
    
    // A trigger no Supabase vai copiar os dados para a tabela 'profiles'.
    // Redireciona para a página de login com uma mensagem de sucesso para o usuário confirmar o email.
    redirect('/login?signup=success');

  } catch (error: any) {
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error; 
    }
    return {
      message: "Ocorreu um erro inesperado. Tente novamente.",
      errors: { _form: [error.message || "Falha no cadastro."] },
      success: false,
    };
  }
}
