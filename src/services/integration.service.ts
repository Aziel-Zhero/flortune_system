// src/services/integration.service.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { auth } from "@/lib/auth";
import type { ServiceResponse } from "@/types/database.types";

interface TelegramCredentials {
    bot_token: string;
    chat_id: string;
}

// Verifica se o usuário autenticado é um administrador.
async function isAdmin() {
  const session = await auth();
  if (!session?.user?.profile) return false;
  return session.user.profile.role === 'admin';
}

export async function getIntegration(service: 'telegram'): Promise<ServiceResponse<TelegramCredentials | null>> {
  if (!await isAdmin()) {
    return { data: null, error: "Acesso não autorizado." };
  }
  
  if(!supabaseAdmin) {
    return { data: null, error: "Conexão com o banco de dados não disponível." };
  }

  try {
    const { data, error } = await supabaseAdmin
        .from('telegram')
        .select('bot_token, chat_id')
        .eq('id', 1)
        .single();
        
    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw error;
    }
    
    return { data: data as TelegramCredentials | null, error: null };

  } catch (err: any) {
    console.error(`Error fetching integration for ${service}:`, err);
    return { data: null, error: `Falha ao buscar credenciais para ${service}.` };
  }
}

export async function updateIntegration(credentials: TelegramCredentials): Promise<ServiceResponse<TelegramCredentials>> {
  if (!await isAdmin()) {
    return { data: null, error: "Acesso não autorizado." };
  }
  
  if(!supabaseAdmin) {
    return { data: null, error: "Conexão com o banco de dados não disponível." };
  }

  try {
    const { data: updatedData, error } = await supabaseAdmin
        .from('telegram')
        .update({
            bot_token: credentials.bot_token,
            chat_id: credentials.chat_id,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

    if (error) throw error;
    
    return { data: updatedData as TelegramCredentials, error: null };

  } catch (err: any) {
     console.error(`Error updating integration for telegram:`, err);
    return { data: null, error: `Falha ao salvar credenciais para o Telegram.` };
  }
}
