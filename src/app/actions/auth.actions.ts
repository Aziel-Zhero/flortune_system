// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "A senha é obrigatória."),
});

const signupFormSchema = z.object({
  fullName: z.string().min(2, "Nome Completo ou Razão Social é obrigatório."),
  displayName: z.string().min(2, "Nome de Exibição ou Fantasia é obrigatório."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  accountType: z.enum(['pessoa', 'empresa']),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  rg: z.string().optional(),
});


export async function loginUser(formData: FormData) {
    const validatedFields = loginSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return { error: "Campos inválidos." };
    }

    const { email, password } = validatedFields.data;
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Login error:", error.message);
        // Não redireciona, o formulário no cliente mostrará o erro
        redirect('/login?error=invalid_credentials');
    }
    
    if (authData.user) {
         const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
             console.error("Profile fetch error after login:", profileError.message);
             redirect('/login?error=profile_not_found');
        }
        
        // Redirecionamento com base na role do usuário
        const targetDashboard = profile?.role === 'admin' ? '/dashboard-admin' : '/dashboard';
        redirect(targetDashboard);
    }
}


export async function signupUser(formData: FormData) {
  const origin = headers().get("origin");

  const validatedFields = signupFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  
  if (!validatedFields.success) {
      console.log("Signup validation failed:", validatedFields.error.flatten().fieldErrors);
      return { error: "Dados de cadastro inválidos." };
  }
  
  const { email, password, fullName, displayName, accountType, cpf, cnpj, rg } = validatedFields.data;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: {
        full_name: fullName,
        display_name: displayName,
        account_type: accountType,
        cpf_cnpj: accountType === 'pessoa' ? cpf : cnpj,
        rg: rg,
        role: 'user', // Sempre cria como 'user' no signup padrão
        has_seen_welcome_message: false,
      },
    },
  });

  if (error) {
    console.error("Supabase signup error:", error.message);
    if (error.message.includes("User already registered")) {
        redirect('/signup?error=user_already_exists');
    }
    redirect('/signup?error=signup_failed');
  }

  // Redireciona para a página de login com uma mensagem de sucesso
  redirect('/login?signup=success');
}


// --- Ação para criar o admin a partir da rota de setup ---
const setupAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  secretCode: z.string().min(1, "O código secreto é obrigatório."),
});

export async function setupAdminUser(formData: FormData) {
  const validatedFields = setupAdminSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  
  if (!validatedFields.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const { email, password, secretCode } = validatedFields.data;
  const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "flortune-super-admin-2024";

  if (secretCode !== ADMIN_SECRET_CODE) {
    return { success: false, error: "Código secreto inválido." };
  }
  
  if (!supabaseAdmin) {
    return { success: false, error: "Serviço de administração indisponível." };
  }

  // 1. Criar o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Já cria o usuário como confirmado
    user_metadata: { full_name: "Administrador", display_name: "Admin" },
  });

  if (authError) {
    if (authError.message.includes("User already exists")) {
        return { success: false, error: "Este e-mail já está cadastrado." };
    }
    return { success: false, error: `Erro na autenticação: ${authError.message}` };
  }

  const newUser = authData.user;
  if (!newUser) {
    return { success: false, error: "Não foi possível criar o usuário." };
  }

  // 2. O trigger `handle_new_user` já deve ter criado o perfil. Vamos atualizá-lo para ser admin.
  //    Se o trigger falhar, o ON CONFLICT fará o trabalho de inserção/atualização.
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: newUser.id,
      email: email,
      full_name: 'Administrador',
      display_name: 'Admin',
      role: 'admin',
      account_type: 'pessoa',
      has_seen_welcome_message: true,
    })
    .eq('id', newUser.id);
    
  if (profileError) {
    // Se a criação do perfil falhar, deletamos o usuário de autenticação para manter a consistência
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return { success: false, error: `Erro ao criar perfil: ${profileError.message}` };
  }

  return { success: true, message: `Administrador ${email} criado com sucesso!` };
}
