// src/app/actions/auth.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

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
      return { error: "Credenciais inválidas. Verifique seu e-mail e senha." };
    }
    if (signInError.message.includes("Email not confirmed")) {
      return { error: "Você precisa confirmar seu e-mail antes de fazer login." };
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
  
  // Se a confirmação de e-mail estiver ATIVADA no Supabase, redirecionamos para a tela de login com uma mensagem de sucesso.
  if (data.user && !data.session) {
    return redirect('/login?signup=success');
  }
  
  // Se a confirmação de e-mail estiver DESATIVADA (ambiente de dev), o usuário já terá uma sessão e será redirecionado para o dashboard.
  return redirect("/dashboard");
}
