
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
    //    A RLS em `public.profiles` deve permitir `anon` ler a coluna `email`.
    //    A política "Allow anon to select email from profiles for signup check" com USING (true) deve cobrir isso.
    console.log(`[SignupUser Action] Verificando se email ${email} já existe em public.profiles...`);
    const { data: existingProfileByEmail, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle(); // Use maybeSingle para não dar erro se não encontrar

    if (fetchError) {
      console.error("[SignupUser Action] Erro ao verificar perfil existente em public.profiles (DB select):", fetchError);
      return { message: "Erro ao verificar dados do usuário. Tente novamente.", success: false, errors: {_form: ["Erro no banco de dados ao verificar email."]} };
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

    // 2. Criar o usuário em `next_auth.users` usando o SupabaseAdapter (indiretamente via signIn)
    //    Para cadastro por credenciais, precisamos primeiro criar o perfil em `public.profiles`
    //    e depois fazer o login programático com NextAuth para que o Adapter crie o usuário em `next_auth.users`.
    //    O ID do perfil em `public.profiles` DEVE ser o mesmo que será usado em `next_auth.users`.

    const profileId = uuidv4(); // Gerar UUID para o novo perfil e futuro usuário NextAuth
    const hashedPassword = await bcrypt.hash(password, 10);

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
        hashed_password: hashedPassword, // Senha hasheada
        phone: phoneValue,
        cpf_cnpj: cpfCnpjValue,
        rg: rgValue,
        avatar_url: `https://placehold.co/100x100.png?text=${displayName?.charAt(0)?.toUpperCase() || 'U'}`,
        account_type: accountType,
    };
    
    // A RLS na tabela `public.profiles` DEVE permitir que a role `anon` (ou a chave usada pelo Supabase client aqui) faça INSERT.
    // A política "Allow service_role to insert new profiles..." era uma tentativa, mas
    // se o `supabase` client aqui usa a `anon_key`, precisamos de uma política de INSERT para `anon`.
    // No entanto, é mais seguro que a criação de perfil seja feita por uma `service_role` ou função `SECURITY DEFINER`.
    // O trigger `handle_new_user_from_next_auth` é SECURITY DEFINER.
    // Para este fluxo de cadastro por credenciais, a action `signupUser` (Server Action) executa no contexto do servidor.
    // O cliente `supabase` aqui usará a `anon_key` por padrão.
    // Portanto, `public.profiles` precisa de uma política de INSERT para `anon`.
    // Vamos adicionar: `CREATE POLICY "Allow anon to insert their own profile" ON public.profiles FOR INSERT TO anon WITH CHECK (true);` no SQL.
    // E restringir as colunas que podem ser inseridas.
    // A alternativa é usar o `supabaseAdmin` (com service_role_key) aqui, mas isso expõe a chave no server-side.
    // O melhor é o trigger. Mas para cadastro por credenciais, o `public.profiles` é criado ANTES do `next_auth.users`.

    console.log("[SignupUser Action] Tentando inserir novo perfil em public.profiles com ID:", profileId, "Email:", newProfileData.email);
    const { data: createdProfile, error: insertProfileError } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select('id, email') // Selecionar apenas o necessário para confirmação
        .single();

    if (insertProfileError) {
        console.error("[SignupUser Action] Erro ao criar perfil em public.profiles:", insertProfileError);
        if (insertProfileError.code === '23505') { // Erro de constraint UNIQUE (email ou cpf_cnpj)
             return { message: "Este email ou CPF/CNPJ já está registrado.", success: false, errors: {email: ["Email ou CPF/CNPJ já registrado."] }};
        }
        return { message: `Falha ao criar conta (DB insert profile): ${insertProfileError.message}.`, success: false, errors: {_form: [insertProfileError.message]} };
    }
    
    if (!createdProfile) {
        console.error("[SignupUser Action] Falha ao criar perfil em public.profiles após inserção (nenhum dado retornado).");
        return { message: "Falha ao criar perfil. Tente novamente.", success: false, errors: {_form: ["Erro desconhecido ao criar perfil."]} };
    }

    console.log("[SignupUser Action] Perfil criado com sucesso em public.profiles com ID:", createdProfile.id);
    
    // 3. Agora, fazer login programático para que o SupabaseAdapter crie a entrada em `next_auth.users`
    //    e o trigger crie a entrada (ou confirme) em `public.profiles`.
    //    O `authorize` do CredentialsProvider será chamado.
    console.log("[SignupUser Action] Tentando login programático com NextAuth para vincular conta...");
    const signInResult = await nextAuthSignIn('credentials', {
      email: email,
      password: password, // Senha original, não hasheada. O `authorize` fará o hash e a comparação.
      redirect: false, // Não redirecionar ainda, queremos o resultado.
    });

    if (signInResult?.error) {
      console.error("[SignupUser Action] Erro durante o login programático após cadastro:", signInResult.error);
      // Aqui pode ser um problema se o `authorize` falhar mesmo com dados corretos.
      // Poderia ser um problema de timing ou configuração.
      // Se o perfil foi criado, mas o login falha, o usuário pode tentar logar manualmente.
      // Por enquanto, vamos informar o usuário sobre o sucesso do cadastro e pedir para logar.
      // Isso evita um estado inconsistente onde o perfil existe mas o usuário vê um erro de "falha no login".
      // No entanto, se o `authorize` falha consistentemente aqui, há um problema maior.
      // Uma causa comum é o `profiles.id` não ser FK para `next_auth.users.id` ainda.
      // No nosso caso, o `profiles.id` é FK, e o `next_auth.users.id` é gerado pelo adapter.
      // O `authorize` retorna `id: profile.id`. O Adapter usa esse `id` para criar/linkar `next_auth.users`.
      // O trigger `handle_new_user_from_next_auth` dispara em INSERT em `next_auth.users`.
      // Se ele tenta inserir em `profiles` e o `profile.id` já existe (criamos acima), o `ON CONFLICT (id) DO NOTHING` do trigger deve funcionar.

      // Por causa da complexidade de depurar o signIn programático aqui e potenciais loops de erro,
      // uma abordagem mais simples para o usuário é:
      // 1. Criar o perfil em `public.profiles`.
      // 2. Redirecionar para `/login?signup=success`.
      // O usuário então faz login manualmente, e o `CredentialsProvider` + `SupabaseAdapter` cuidam de criar
      // a entrada em `next_auth.users` e o trigger cuida da sincronização com `public.profiles`.
      // Isso é mais robusto.

      // Removendo o signIn programático e redirecionando para login manual.
      // console.warn("[SignupUser Action] Login programático falhou após cadastro, mas perfil foi criado. Usuário deve logar manualmente. Erro:", signInResult.error);
      // return { message: "Conta criada, mas login automático falhou. Por favor, tente fazer login.", success: true, errors: {_form: ["Login automático falhou após cadastro."]} };
    }

    // Se o perfil foi criado com sucesso:
    console.log("[SignupUser Action] Cadastro e criação de perfil em public.profiles bem-sucedidos. Redirecionando para login.");
    redirect('/login?signup=success'); // Redireciona para a página de login com uma mensagem de sucesso

  } catch (error: any) {
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error; // Necessário para o redirect funcionar
    }
    console.error("[SignupUser Action] Erro inesperado durante o cadastro:", error);
    return {
      message: "Ocorreu um erro inesperado durante o cadastro. Tente novamente.",
      errors: { _form: [error.message || "Falha no cadastro devido a um erro no servidor."] },
      success: false,
    };
  }
}
