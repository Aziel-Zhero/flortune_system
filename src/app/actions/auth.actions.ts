
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/app/api/auth/[...nextauth]/route'; // Importa de authConfig
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import type { Profile } from "@/types/database.types";

// Esquemas Zod permanecem os mesmos para validação de formulário
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
    
    // Usar o signIn do NextAuth para o provider 'credentials'
    // O redirecionamento é tratado pelo NextAuth por padrão em caso de sucesso.
    // Erros são retornados para o callback 'authorize' e podem ser pegos aqui se o signIn falhar.
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false, // Importante: define como false para lidar com o resultado aqui
    });
    
    // Se nextAuthSignIn não lançar um erro e redirect for false, o login pode ou não ter sido bem-sucedido.
    // O 'authorize' callback em auth.ts é quem realmente valida.
    // Para dar feedback aqui, precisaríamos de uma forma de saber o resultado de 'authorize'.
    // Uma maneira é o authorize lançar um erro customizado que o nextAuthSignIn propaga.
    // Por agora, se não houver erro, assumimos que o NextAuth redirecionará se for sucesso,
    // ou a página de login mostrará um erro vindo de um query param ?error=CredentialsSignin
    // Para um controle mais fino, muitas vezes a lógica de chamada ao signIn é feita no lado do cliente.
    // Vamos assumir que se chegou aqui sem erro do signIn, e redirect:true (padrão) fosse usado, o NextAuth lidaria.
    // Com redirect:false, o fluxo continua aqui. Precisamos verificar se a sessão foi criada.
    // No entanto, a maneira mais idiomática do NextAuth é deixar ele lidar com o redirect.
    // Para manter o padrão de Server Action, o ideal seria que `nextAuthSignIn` retornasse um status ou lançasse erro.

    // Se você usar `redirect: true` (ou omitir), NextAuth redireciona para `callbackUrl` (padrão `/`) ou `pages.signIn` em erro.
    // Como estamos em uma Server Action e queremos retornar um estado, `redirect: false` é mais complexo.
    // Vamos tentar com redirecionamento direto.
    
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard', // Redireciona para o dashboard em sucesso
    });
    // Se o login falhar, o NextAuth geralmente redireciona para a página de login com um erro na URL.
    // ex: /login?error=CredentialsSignin

    // A linha abaixo não será alcançada se o signIn redirecionar ou lançar erro que redireciona.
    return { message: "Tentativa de login processada.", success: true }; 

  } catch (error: any) {
    // NextAuth pode lançar erros específicos.
    // O erro "CredentialsSignin" é comum e pode ser tratado.
    if (error.type === 'CredentialsSignin' || (error.cause && error.cause.type === 'CredentialsSigninError')) {
      console.error("loginUser action (NextAuth): Erro de credenciais:", error.message);
      return {
        message: "Email ou senha inválidos.",
        errors: { _form: ["Email ou senha inválidos."] },
        success: false,
      };
    }
    console.error("loginUser action (NextAuth): Erro inesperado durante o login:", error);
    return {
      message: "Ocorreu um erro inesperado. Tente novamente.",
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

    // Verificar se o email já existe na tabela profiles
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

    // Supabase agora é apenas para armazenar o perfil. O ID será gerado pelo Supabase.
    // NextAuth não cria o usuário no DB automaticamente com Credentials provider.
    const newProfileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { hashed_password: string, email: string } = {
        full_name: fullName,
        display_name: displayName,
        email: email, // Adicionando email ao perfil
        hashed_password: hashedPassword,
        phone: phoneValue,
        cpf_cnpj: cpfCnpjValue,
        rg: rgValue,
        avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
        // Outros campos do perfil como accountType podem ser adicionados se a tabela `profiles` os tiver
    };
    
    // Insere na tabela profiles. O user_id será o id da tabela profiles.
    const { data: createdProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select()
        .single();

    if (insertError) {
        console.error("signupUser action (NextAuth): Erro ao criar perfil no Supabase:", insertError);
        return { message: "Falha ao criar conta (DB). Tente novamente.", success: false, errors: {_form: [insertError.message]} };
    }
    
    if (!createdProfile) {
        return { message: "Falha ao criar perfil após inserção. Tente novamente.", success: false };
    }

    console.log("signupUser action (NextAuth): Perfil criado com ID:", createdProfile.id);
    
    // Após o cadastro bem-sucedido, redireciona para o login
    // Ou pode tentar logar o usuário automaticamente, mas é mais simples redirecionar.
    redirect('/login?signup=success');

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error("signupUser action (NextAuth): Erro inesperado:", error);
    return {
      message: "Ocorreu um erro inesperado. Tente novamente.",
      errors: { _form: ["Falha no cadastro devido a um erro no servidor."] },
      success: false,
    };
  }
}


// Google Sign-In com NextAuth (placeholder para quando for re-adicionado)
// export async function signInWithGoogle() {
//   await nextAuthSignIn('google', { redirectTo: '/dashboard' });
// }

export async function logoutUser() {
  console.log("logoutUser action (NextAuth): Iniciando processo de logout...");
  await nextAuthSignOut({ redirectTo: '/login?logout=success' });
  // redirect('/login?logout=success'); // nextAuthSignOut já lida com o redirect
}
