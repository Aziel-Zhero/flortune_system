// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// --- Login Action ---
export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login Error:", error.message);
    if (error.message.includes("Invalid login credentials")) {
      return redirect("/login?error=invalid_credentials");
    }
    return redirect(`/login?error=${error.message}`);
  }

  // On successful login, onAuthStateChange in the context will handle the session
  // and the middleware will redirect to the correct dashboard.
  // We just need to refresh the page to trigger it.
  return redirect("/dashboard");
}


// --- Signup Action ---
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  displayName: z.string().min(2),
  accountType: z.enum(['pessoa', 'empresa']),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  rg: z.string().optional(),
});


export async function signupUser(formData: FormData) {
  const origin = headers().get('origin');
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
      console.error("Signup validation failed:", validatedFields.error);
      return redirect('/signup?error=validation_failed');
  }

  const { email, password, fullName, displayName, accountType, cpf, cnpj, rg } = validatedFields.data;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Passa os dados do perfil para o Supabase, que podem ser usados no trigger
      data: {
        full_name: fullName,
        display_name: displayName,
        account_type: accountType,
        cpf_cnpj: accountType === 'pessoa' ? cpf : cnpj,
        rg: rg,
        has_seen_welcome_message: false,
        role: 'user', // Todos os novos usuários são 'user' por padrão
        plan_id: 'tier-cultivador' // Plano gratuito por padrão
      },
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("User already registered")) {
      return redirect('/signup?error=user_already_exists');
    }
    console.error("Supabase signup error:", error.message);
    return redirect(`/signup?error=${error.message}`);
  }

  // Redireciona para a página de login com uma mensagem de sucesso
  return redirect('/login?signup=success');
}


// --- Admin Setup Action ---
const setupAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  secretCode: z.string().min(1, "O código secreto é obrigatório."),
});

// Ação de servidor para useActionState recebe o estado anterior e o FormData
export async function setupAdminUser(prevState: any, formData: FormData) {
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
  
  // Para criar um admin, usamos um cliente Supabase de servidor TEMPORÁRIO
  // com a service_role key. Isso é necessário porque não há um admin logado ainda.
  const supabaseAdmin = createClient();
  // NOTE: In a real scenario with proper RLS, you'd use a dedicated admin client
  // with the service_role key like in 'src/lib/supabase/admin.ts'.
  // For this context, the standard server client will suffice if RLS is permissive for setup.
  
  // 1. Criar o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: {
      data: { 
        full_name: "Administrador", 
        display_name: "Admin",
        role: 'admin',
        has_seen_welcome_message: true,
      },
    },
  });

  if (authError) {
    if (authError.message.includes("User already registered")) {
        // Se o usuário já existe, vamos tentar apenas torná-lo admin
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers({ email });
        if(userError || users.length === 0) {
            return { success: false, error: "Usuário já existe, mas não foi possível atualizá-lo para admin." };
        }
        const userId = users[0].id;
        const { error: profileError } = await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', userId);
        if (profileError) {
            return { success: false, error: "Usuário já existe, mas falhou ao definir a permissão de admin." };
        }
         return { success: true, message: `O usuário ${email} já existia e foi promovido a administrador.` };
    }
    return { success: false, error: `Erro na autenticação: ${authError.message}` };
  }

  const newUser = authData.user;
  if (!newUser) {
    return { success: false, error: "Não foi possível criar o usuário." };
  }

  // 2. O trigger `handle_new_user` já deve ter criado o perfil. Vamos atualizá-lo para ser admin.
  // Esta etapa é uma garantia extra, caso o trigger falhe ou os metadados do signUp não funcionem como esperado.
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
        role: 'admin', 
        has_seen_welcome_message: true,
        updated_at: new Date().toISOString(),
    })
    .eq('id', newUser.id);
    
  if (profileError) {
    // Se a criação do perfil falhar, deletamos o usuário de autenticação para manter a consistência
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return { success: false, error: `Erro ao criar perfil: ${profileError.message}` };
  }

  return { success: true, message: `Administrador ${email} criado com sucesso!` };
}