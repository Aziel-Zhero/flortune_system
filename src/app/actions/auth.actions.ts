// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; 

const emailSchema = z.string().email({ message: "Endereço de email inválido." });
const passwordSchema = z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
  .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." })
  .regex(/[^a-zA-Z0-9]/, { message: "A senha deve conter pelo menos um caractere especial." });

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "O nome completo deve ter pelo menos 2 caracteres." }),
  displayName: z.string().min(2, { message: "O nome de exibição deve ter pelo menos 2 caracteres." }),
  phone: z.string().optional(),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  cpf: z.string().optional(),
  rg: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
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
    cpf?: string[];
    rg?: string[];
    _form?: string[];
  };
  success?: boolean;
};


export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const errorMsg = "Serviço de autenticação indisponível. Configuração do servidor incompleta.";
    console.error(`[Signup Action] Error: ${errorMsg}`);
    return { message: errorMsg, success: false, errors: { _form: [errorMsg] } };
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = signupSchema.safeParse(rawData);

    if (!validatedFields.success) {
      console.error("[Signup Action] Validation failed:", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos. Por favor, verifique os dados inseridos.",
        success: false,
      };
    }

    const { email, password, fullName, displayName, phone, cpf, rg } = validatedFields.data;
    
    // Sempre cria como 'pessoa' e plano 'cultivador'
    const accountType = 'pessoa';
    const planId = 'tier-cultivador';
    
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          display_name: displayName,
          phone: phone ? phone.replace(/\D/g, '') : null,
          account_type: accountType,
          cpf_cnpj: cpf ? cpf.replace(/\D/g, '') : null,
          rg: rg ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null,
          avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
          plan_id: planId,
          has_seen_welcome_message: false, // Novo campo
        }
      }
    });

    if (signUpError) {
        console.error("[Signup Action] Supabase signUp error:", signUpError.message);
        if (signUpError.message.includes("User already registered")) {
            return { message: "Este email já está cadastrado.", success: false, errors: { email: ["Este email já está em uso."] } };
        }
        return { message: `Falha ao criar usuário: ${signUpError.message}`, success: false, errors: { _form: [signUpError.message] } };
    }

    if (!authData.user) {
        const errorMsg = "Ocorreu um erro inesperado e o usuário não foi criado.";
        console.error(`[Signup Action] Error: ${errorMsg}`);
        return { message: errorMsg, success: false, errors: { _form: ["Falha ao obter dados do novo usuário."]}};
    }
    
    console.log("[Signup Action] User created successfully. Redirecting to login for email confirmation.");
    redirect('/login?signup=success');

  } catch (error: any) {
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error; 
    }
    console.error("[Signup Action] Unexpected error:", error);
    return {
      message: "Ocorreu um erro inesperado. Tente novamente.",
      errors: { _form: [error.message || "Falha no cadastro."] },
      success: false,
    };
  }
}
