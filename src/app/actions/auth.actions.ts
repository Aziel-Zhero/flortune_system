// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin"; // Importa o cliente admin
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

  // On successful login, the middleware will redirect to the correct dashboard.
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

  // 1. Criar o usuário no Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: {
        full_name: fullName,
        display_name: displayName,
        avatar_url: `https://placehold.co/100x100.png?text=${displayName.charAt(0).toUpperCase()}`,
        // Adicionando os outros campos no metadata para o trigger usar
        account_type: accountType,
        cpf_cnpj: accountType === 'pessoa' ? cpf : cnpj,
        rg: rg,
      }
    },
  });

  if (authError) {
    if (authError.message.includes("User already registered")) {
      return redirect('/signup?error=user_already_exists');
    }
    console.error("Supabase signup error:", authError.message);
    return redirect(`/signup?error=${authError.message}`);
  }

  // Redireciona para a página de login com uma mensagem de sucesso
  // O trigger no banco de dados cuidará da criação do perfil.
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

  if (!supabaseAdmin) {
    return { success: false, error: "A configuração do servidor (Supabase Admin) não está completa." };
  }

  const { email, password, secretCode } = validatedFields.data;
  const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "flortune-super-admin-2024";

  if (secretCode !== ADMIN_SECRET_CODE) {
    return { success: false, error: "Código secreto inválido." };
  }
  
  // Verifica se o usuário já existe
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ email });
  if (listError) {
      console.error("Admin listUsers error:", listError);
      return { success: false, error: "Não foi possível verificar usuários existentes." };
  }

  if (users.length > 0) {
      // Usuário já existe, vamos apenas garantir que o perfil está correto
      const userId = users[0].id;
      const { error: profileUpdateError } = await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', userId);
      if (profileUpdateError) {
          return { success: false, error: "Usuário já existe, mas falhou ao definir a permissão de admin." };
      }
      return { success: true, message: `O usuário ${email} já existia e foi promovido a administrador.` };
  }

  // Usuário não existe, vamos criar
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Já cria o usuário como confirmado
    user_metadata: {
        full_name: "Administrador",
        display_name: "Admin",
    }
  });

  if (authError || !authData.user) {
    return { success: false, error: `Erro na autenticação: ${authError?.message || 'usuário não criado'}` };
  }
  
  const newUser = authData.user;

  // Atualizar o perfil que o trigger deve ter criado para a role de admin
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
        role: 'admin', 
        has_seen_welcome_message: true 
    })
    .eq('id', newUser.id);
    
  if (profileError) {
    // Se a atualização do perfil falhar, deletamos o usuário de autenticação
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return { success: false, error: `Erro ao definir permissões de admin: ${profileError.message}` };
  }

  return { success: true, message: `Administrador ${email} criado com sucesso!` };
}
