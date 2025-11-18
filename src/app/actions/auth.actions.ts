// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";


// --- Login Action ---
export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." };
  }

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
    if (error.message.includes("Email not confirmed")) {
      return redirect("/login?error=email_not_confirmed");
    }
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single();

  if (profile?.role === 'admin') {
      return redirect("/dashboard-admin");
  }

  return redirect("/dashboard");
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
      }
    }
  });

  if (authError) {
    if (authError.message.includes("User already registered")) {
      return redirect('/signup?error=user_already_exists');
    }
    console.error("Supabase signup error:", authError.message);
    return redirect(`/signup?error=${authError.message}`);
  }
  
  if (!data.user) {
    console.error("User not created, but no auth error.");
    return redirect('/signup?error=unknown_creation_error');
  }
  
  return redirect('/login?signup=success');
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
    .upsert({ 
        id: newUser.id,
        email: email,
        full_name: "Administrador",
        display_name: "Admin",
        role: 'admin', 
        has_seen_welcome_message: true 
    }, { onConflict: 'id' });
    
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return { success: false, error: `Erro ao criar o perfil de admin: ${profileError.message}` };
  }

  return { success: true, message: `Administrador ${email} criado com sucesso!` };
}
