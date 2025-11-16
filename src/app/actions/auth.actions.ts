// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ServiceResponse } from "@/types/database.types";

const newUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']),
});

type NewUserFormData = z.infer<typeof newUserSchema>;
type CreateUserResponse = ServiceResponse<{ email: string; id: string }>;

export async function createUser(formData: NewUserFormData): Promise<CreateUserResponse> {
  // Validação do lado do servidor
  const validatedFields = newUserSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { data: null, error: "Dados inválidos fornecidos." };
  }

  if (!supabaseAdmin) {
    const errorMsg = "O cliente de administração do Supabase não está inicializado. Verifique as variáveis de ambiente do servidor.";
    console.error(errorMsg);
    return { data: null, error: errorMsg };
  }

  const { fullName, email, password, role } = validatedFields.data;

  // 1. Criar o usuário no sistema de autenticação do Supabase
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // O usuário já é criado como confirmado
    user_metadata: {
      full_name: fullName,
      display_name: fullName.split(' ')[0], // Usa o primeiro nome como display_name padrão
    },
  });

  if (authError) {
    console.error("Supabase admin createUser error:", authError.message);
    if (authError.message.includes("User already exists")) {
        return { data: null, error: "Um usuário com este e-mail já existe." };
    }
    return { data: null, error: `Erro de autenticação: ${authError.message}` };
  }

  const newUser = authData.user;
  if (!newUser) {
    return { data: null, error: "Falha ao criar o usuário, nenhum usuário retornado." };
  }

  // 2. Atualizar o perfil do usuário recém-criado na tabela public.profiles
  // O trigger 'handle_new_user' já deve ter criado a linha. Nós apenas a atualizamos.
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      role: role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', newUser.id)
    .select()
    .single();

  if (profileError) {
    console.error("Supabase update profile error:", profileError.message);
    // Se a atualização do perfil falhar, o ideal seria deletar o usuário criado para consistência.
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return { data: null, error: `Falha ao definir as permissões do usuário: ${profileError.message}` };
  }

  return { data: { email: newUser.email!, id: newUser.id }, error: null };
}


// --- Ação para criar o admin a partir da rota de setup ---
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
