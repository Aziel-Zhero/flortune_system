// src/app/actions/admin-auth.actions.ts
"use server";

import { z } from "zod";
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from "@/lib/supabase/admin";
import { signIn } from "@/lib/auth";

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type AdminLoginFormState = {
  success: boolean;
  message: string;
};

export async function adminLogin(
  prevState: AdminLoginFormState,
  formData: FormData
): Promise<AdminLoginFormState> {
  const validation = adminLoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validation.success) {
    return { success: false, message: "Formato de email ou senha inválido." };
  }

  if (!supabaseAdmin) {
    return { success: false, message: "Serviço de autenticação indisponível." };
  }
  
  const { email, password } = validation.data;

  try {
    const { data: adminUser } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (!adminUser) {
      return { success: false, message: "Credenciais inválidas." };
    }

    const passwordMatches = await bcrypt.compare(password, adminUser.hashed_password);

    if (!passwordMatches) {
      return { success: false, message: "Credenciais inválidas." };
    }

    // Se a senha estiver correta, usamos o signIn do NextAuth com o provedor de "admin"
    // para estabelecer a sessão segura.
    await signIn("admin-credentials", {
      email: adminUser.email,
      role: 'admin',
      redirect: false, // Importante para não causar erro de redirect em Server Action
    });
    
    // Se o signIn não lançar um erro, consideramos sucesso.
    // O redirecionamento será tratado no lado do cliente.
    return { success: true, message: "Login bem-sucedido." };

  } catch (error: any) {
    console.error("[Admin Login Action Error]:", error);
    // Erros específicos do NextAuth podem ser capturados aqui
    if (error.type === 'CredentialsSignin') {
      return { success: false, message: 'Falha ao criar sessão de admin.' };
    }
    // Erros genéricos
    return { success: false, message: "Ocorreu um erro inesperado." };
  }
}
