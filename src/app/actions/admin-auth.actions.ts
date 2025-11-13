// src/app/actions/admin-auth.actions.ts
"use server";

import { z } from "zod";
import { signIn } from "@/lib/auth"; // Usaremos o signIn do next-auth para criar a sessão
import { supabaseAdmin } from "@/lib/supabase/admin";
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "Senha é obrigatória."),
});

export type AdminLoginFormState = {
  message?: string;
  success: boolean;
};

export async function adminLogin(prevState: AdminLoginFormState, formData: FormData): Promise<AdminLoginFormState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: "Dados de login inválidos.",
      success: false,
    };
  }
  
  const { email, password } = validatedFields.data;

  try {
    if (!supabaseAdmin) {
        throw new Error("Conexão com o banco de dados de administração não disponível.");
    }

    const { data: adminUser, error: dbError } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('email', email)
        .single();
    
    if (dbError || !adminUser) {
        return { message: "Credenciais de administrador inválidas.", success: false };
    }

    const passwordMatches = await bcrypt.compare(password, adminUser.hashed_password);

    if (!passwordMatches) {
        return { message: "Credenciais de administrador inválidas.", success: false };
    }
    
    // Se a senha estiver correta, criamos uma sessão usando a estratégia do next-auth
    // Passamos um objeto `user` customizado para o `signIn` que será pego pelo callback `jwt`
    await signIn('credentials', {
      email: adminUser.email,
      // Passamos a senha correta para o authorize não falhar, mas ele não será usado de fato
      // A lógica principal é criar uma sessão com o 'user' que passamos aqui
      password: "admin_session_login_placeholder", // Placeholder
      
      // O mais importante: passamos os dados do admin para o callback JWT
      // O next-auth entende que se um `user` é passado aqui, ele deve ser usado para criar o token
      // E nós adicionamos uma propriedade 'role' para identificar o admin
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.full_name,
        profile: {
          id: adminUser.id,
          email: adminUser.email,
          display_name: adminUser.full_name,
          role: 'admin',
        }
      },
      redirect: false, // Não redirecionamos aqui, o frontend fará isso
    });

    return { success: true };
    
  } catch (error: any) {
    console.error("Admin Login Error:", error);
    if (error.type === 'CredentialsSignin') {
      return { message: 'Credenciais inválidas.', success: false };
    }
    return { message: 'Ocorreu um erro inesperado.', success: false };
  }
}
