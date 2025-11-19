// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface ActionResult {
  error?: string;
  redirectTo?: string;
  success?: boolean;
}

// --- Login Action ---
export async function loginUser(prevState: any, formData: FormData): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." };
  }

  const supabase = createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error("Login Error:", signInError.message);
    if (signInError.message.includes("Invalid login credentials")) {
      return { error: "invalid_credentials" };
    }
    if (signInError.message.includes("Email not confirmed")) {
      return { error: "email_not_confirmed" };
    }
    return { error: signInError.message };
  }
  
  // Após o login bem-sucedido, verificamos o perfil para redirecionamento.
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'admin') {
          return { success: true, redirectTo: "/dashboard-admin" };
      }
  }

  return { success: true, redirectTo: "/dashboard" };
}


// --- Signup Action ---
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  displayName: z.string().min(2),
});

export async function signupUser(formData: FormData) {
  const origin = headers().get('origin');
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
      console.error("Signup validation failed:", validatedFields.error);
      return redirect('/signup?error=validation_failed');
  }

  const { email, password, fullName, displayName } = validatedFields.data;
  
  const supabase = createClient();
  
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: {
          full_name: fullName,
          display_name: displayName,
          avatar_url: `https://placehold.co/100x100.png?text=${displayName.charAt(0).toUpperCase()}`,
          // Garante que o has_seen_welcome_message seja false para novos usuários
          has_seen_welcome_message: false,
      }
    }
  });

  if (authError) {
    if (authError.message.includes("User already registered")) {
      return redirect('/signup?error=user_already_exists');
    }
    console.error("Supabase signup error:", authError.message);
    return redirect(`/signup?error=${encodeURIComponent(authError.message)}`);
  }
  
  if (!data.user) {
    console.error("User not created, but no auth error.");
    return redirect('/signup?error=unknown_creation_error');
  }
  
  // A trigger 'handle_new_user' no banco de dados criará o perfil em 'public.profiles'.
  // Se a confirmação de e-mail estiver ATIVADA no Supabase, redirecionamos para a tela de login com uma mensagem de sucesso.
  if (data.user && !data.session) {
    return redirect('/login?signup=success');
  }
  
  // Se a confirmação de e-mail estiver DESATIVADA (ambiente de dev), o usuário já terá uma sessão e será redirecionado para o dashboard.
  return redirect("/dashboard");
}


// --- Admin Setup Action ---
export async function setupAdminUser(prevState: any, formData: FormData) {
  const setupAdminSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
    secretCode: z.string().min(1, "O código secreto é obrigatório."),
  });

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
  
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ email });
  if (listError) {
      console.error("Admin listUsers error:", listError);
      return { success: false, error: "Não foi possível verificar usuários existentes." };
  }

  if (users.length > 0) {
      const userId = users[0].id;
      const { error: profileUpdateError } = await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', userId);
      if (profileUpdateError) {
          return { success: false, error: "Usuário já existe, mas falhou ao definir a permissão de admin." };
      }
      return { success: true, message: `O usuário ${email} já existia e foi promovido a administrador.` };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Cria o admin como já confirmado
    user_metadata: {
        full_name: "Administrador",
        display_name: "Admin",
    }
  });

  if (authError || !authData.user) {
    return { success: false, error: `Erro na autenticação: ${authError?.message || 'usuário não criado'}` };
  }
  
  const newUser = authData.user;
  
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin', has_seen_welcome_message: true })
    .eq('id', newUser.id);
    
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return { success: false, error: `Erro ao definir permissão de admin: ${profileError.message}` };
  }

  return { success: true, message: `Administrador ${email} criado com sucesso!` };
}
