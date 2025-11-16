// src/app/actions/user.actions.ts
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
