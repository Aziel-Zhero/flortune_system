
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import type { Profile } from "@/types/database.types";

const emailSchema = z.string().email({ message: "Endereço de email inválido." });
const passwordSchema = z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
  .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." })
  .regex(/[^a-zA-Z0-9]/, { message: "A senha deve conter pelo menos um caractere especial." });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "A senha é obrigatória." }),
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
  console.log("loginUser action (NextAuth): Iniciando processo de login...");
  try {
    const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos.",
        success: false,
      };
    }
    
    const { email, password } = validatedFields.data;
    
    // Para usar o signIn de Server Action, o redirecionamento é implícito ou via throw/redirect()
    // O NextAuth.js cuida de redirecionar ou lançar um erro que se manifesta.
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard', // Redireciona para o dashboard em sucesso
    });

    // Se o login falhar, o NextAuth tipicamente redireciona para a página de login com um erro na URL
    // ou lança um erro que a Server Action pode pegar se `redirect: false` fosse usado (mais complexo).
    // Com redirectTo, a linha abaixo só é alcançada se houver um erro inesperado antes do redirect.
    return { message: "Tentativa de login processada. Redirecionamento deveria ocorrer.", success: true }; 

  } catch (error: any) {
    console.error("loginUser action (NextAuth): Erro durante o login:", error);
    // Erros do NextAuth (como CredentialsSignin) são geralmente tratados pelo próprio NextAuth
    // resultando em um redirecionamento para a página de login com um parâmetro de erro.
    // Se o erro for pego aqui, é algo mais fundamental ou uma configuração.
    if (error.type === 'CredentialsSignin' || (error.cause && error.cause.type === 'CredentialsSigninError')) {
      return {
        message: "Email ou senha inválidos.",
        errors: { _form: ["Email ou senha inválidos."] },
        success: false,
      };
    }
    // Para erros que não são do NextAuth ou se a action prosseguir após uma falha não tratada pelo redirect
    return {
      message: error.message || "Ocorreu um erro inesperado. Tente novamente.",
      errors: { _form: [error.message || "Falha no login devido a um erro no servidor."] },
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
  console.log("signupUser action (NextAuth): Iniciando processo de cadastro...");
  try {
    const rawData = Object.fromEntries(formData.entries());
    if (rawData.cpf === '') rawData.cpf = undefined;
    if (rawData.cnpj === '') rawData.cnpj = undefined;
    if (rawData.rg === '') rawData.rg = undefined;
    if (rawData.phone === '') rawData.phone = undefined;
    
    const validatedFields = signupSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos.",
        success: false,
      };
    }

    const { email, password, fullName, displayName, phone, accountType, cpf, cnpj, rg } = validatedFields.data;

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = zero rows
      console.error("signupUser action (NextAuth): Erro ao verificar perfil existente:", fetchError);
      return { message: "Erro ao verificar dados. Tente novamente.", success: false };
    }

    if (existingProfile) {
      return {
        errors: { email: ["Este email já está registrado."] },
        message: "Este email já está registrado.",
        success: false,
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let cpfCnpjValue: string | null = null;
    if (accountType === 'pessoa' && cpf) cpfCnpjValue = cpf.replace(/\D/g, ''); 
    else if (accountType === 'empresa' && cnpj) cpfCnpjValue = cnpj.replace(/\D/g, ''); 

    const rgValue = (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null;
    const phoneValue = phone ? phone.replace(/\D/g, '') : null;

    // O ID será gerado automaticamente pelo Supabase (uuid_generate_v4())
    const newProfileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'> = {
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
    
    const { data: createdProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select() // Seleciona todos os campos do perfil criado, incluindo o ID gerado
        .single();

    if (insertError) {
        console.error("signupUser action (NextAuth): Erro ao criar perfil no Supabase:", insertError);
        return { message: "Falha ao criar conta (DB). Tente novamente.", success: false, errors: {_form: [insertError.message]} };
    }
    
    if (!createdProfile) {
        return { message: "Falha ao criar perfil após inserção. Tente novamente.", success: false };
    }

    console.log("signupUser action (NextAuth): Perfil criado com ID:", createdProfile.id);
    
    redirect('/login?signup=success');

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Necessário para o Next.js lidar com o redirect
    }
    console.error("signupUser action (NextAuth): Erro inesperado:", error);
    return {
      message: "Ocorreu um erro inesperado. Tente novamente.",
      errors: { _form: ["Falha no cadastro devido a um erro no servidor."] },
      success: false,
    };
  }
}

export async function logoutUser() {
  console.log("logoutUser action (NextAuth): Iniciando processo de logout...");
  await nextAuthSignOut({ redirectTo: '/login?logout=success' });
}

    