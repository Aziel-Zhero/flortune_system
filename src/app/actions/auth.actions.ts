// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { createClient } from '@/lib/supabase/server';
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
        role: 'user',
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
