
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { signIn as nextAuthSignIn } from '@/app/api/auth/[...nextauth]/route'; // signOut é exportado de lá também
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import type { Profile } from "@/types/database.types";
import { v4 as uuidv4 } from 'uuid'; // Para gerar UUID se necessário

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

// A action de login não é mais usada diretamente pelo form se o form usa signIn('credentials') do next-auth/react
// Mas podemos mantê-la para outros usos ou se o form voltar a usar useActionState com Server Action.
export async function loginUser(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  console.log("loginUser action (Server Action): Iniciando processo de login...");
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
    
    // O nextAuthSignIn aqui chama a lógica do CredentialsProvider que definimos em [...nextauth]/route.ts
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard', 
    });

    // Se o login falhar, NextAuth tipicamente redireciona para a página de login com erro.
    // Esta linha só seria alcançada se houvesse um erro inesperado antes do redirect.
    return { message: "Tentativa de login processada.", success: true }; 

  } catch (error: any) {
    console.error("loginUser action (Server Action): Erro durante o login:", error);
    if (error.type === 'CredentialsSignin' || (error.cause && error.cause.type === 'CredentialsSigninError')) {
      return {
        message: "Email ou senha inválidos.",
        errors: { _form: ["Email ou senha inválidos."] },
        success: false,
      };
    }
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
  console.log("signupUser action: Iniciando processo de cadastro...");
  try {
    const rawData = Object.fromEntries(formData.entries());
    if (rawData.cpf === '') rawData.cpf = undefined;
    if (rawData.cnpj === '') rawData.cnpj = undefined;
    if (rawData.rg === '') rawData.rg = undefined;
    if (rawData.phone === '') rawData.phone = undefined;
    
    const validatedFields = signupSchema.safeParse(rawData);

    if (!validatedFields.success) {
      console.log("signupUser action: Validação falhou", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Campos inválidos.",
        success: false,
      };
    }

    const { email, password, fullName, displayName, phone, accountType, cpf, cnpj, rg } = validatedFields.data;

    // Esta verificação é crucial. O Supabase client aqui usará a anon key.
    // A RLS na tabela profiles DEVE permitir que a role 'anon' faça SELECT no email para esta verificação.
    // Se RLS bloquear, esta query falhará silenciosamente ou retornará erro, dependendo da policy.
    // Com a policy "Allow anon to insert profiles" e "Allow authenticated users to read their own profile", 
    // esta verificação de email existente pode falhar se não houver uma policy de SELECT para anon.
    // Vamos adicionar uma policy para anon poder ler emails para a verificação.
    // ALTERNATIVAMENTE, podemos tentar inserir e tratar o erro de constraint UNIQUE no email.

    console.log(`signupUser action: Verificando se email ${email} já existe em public.profiles...`);
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    // PGRST116: "Query result returned no rows" - significa que o email NÃO existe, o que é bom.
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("signupUser action: Erro ao verificar perfil existente em public.profiles:", fetchError);
      return { message: "Erro ao verificar dados (DB select). Tente novamente.", success: false, errors: {_form: [fetchError.message]} };
    }

    if (existingProfile) {
      console.log("signupUser action: Email já registrado em public.profiles.");
      return {
        errors: { email: ["Este email já está registrado."] },
        message: "Este email já está registrado.",
        success: false,
      };
    }
    console.log("signupUser action: Email não encontrado, prosseguindo com cadastro.");

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileId = uuidv4(); // Gerar UUID para o novo perfil

    let cpfCnpjValue: string | null = null;
    if (accountType === 'pessoa' && cpf) cpfCnpjValue = cpf.replace(/\D/g, ''); 
    else if (accountType === 'empresa' && cnpj) cpfCnpjValue = cnpj.replace(/\D/g, ''); 

    const rgValue = (accountType === 'pessoa' && rg) ? rg.replace(/[^0-9Xx]/gi, '').toUpperCase() : null;
    const phoneValue = phone ? phone.replace(/\D/g, '') : null;
    
    const newProfileData: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: profileId, // Usar o UUID gerado
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
    
    // A RLS na tabela profiles DEVE permitir que a role 'anon' faça INSERT.
    console.log("signupUser action: Tentando inserir novo perfil em public.profiles:", newProfileData.email);
    const { data: createdProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select('id, email') // Selecionar apenas o necessário para confirmação
        .single();

    if (insertError) {
        console.error("signupUser action: Erro ao criar perfil em public.profiles:", insertError);
        // Tratar erro de violação de constraint UNIQUE para email (código 23505 no PostgreSQL)
        if (insertError.code === '23505' && insertError.message.includes('profiles_email_key')) {
             return { message: "Este email já está registrado.", success: false, errors: {email: ["Este email já está registrado."] }};
        }
        return { message: `Falha ao criar conta (DB insert): ${insertError.message}. Verifique as RLS.`, success: false, errors: {_form: [insertError.message]} };
    }
    
    if (!createdProfile) {
        console.error("signupUser action: Falha ao criar perfil em public.profiles após inserção (nenhum dado retornado).");
        return { message: "Falha ao criar perfil. Tente novamente.", success: false };
    }

    console.log("signupUser action: Perfil criado com sucesso em public.profiles com ID:", createdProfile.id);
    
    // Não é necessário criar manualmente em next_auth.users aqui.
    // O SupabaseAdapter deve lidar com a criação do usuário em next_auth.users
    // na primeira vez que o usuário fizer login com sucesso através do CredentialsProvider.
    // O objeto retornado por `authorize` será usado pelo adapter.

    redirect('/login?signup=success');

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; 
    }
    console.error("signupUser action: Erro inesperado:", error);
    return {
      message: "Ocorreu um erro inesperado no cadastro. Tente novamente.",
      errors: { _form: ["Falha no cadastro devido a um erro no servidor."] },
      success: false,
    };
  }
}

// A função logoutUser é fornecida por NextAuth, não precisamos de uma action customizada se usarmos o signOut do cliente.
// import { signOut as nextAuthSignOut } from '@/app/api/auth/[...nextauth]/route';
// export async function logoutUser() {
//   console.log("logoutUser action: Iniciando processo de logout...");
//   await nextAuthSignOut({ redirectTo: '/login?logout=success' });
// }
