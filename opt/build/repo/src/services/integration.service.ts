// src/services/integration.service.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ServiceResponse } from "@/types/database.types";

interface TelegramCredentials {
    bot_token: string;
    chat_id: string;
}

// NOTE: This service uses the supabaseAdmin client because the 'telegram_integration'
// table is not intended to be accessed by regular users via RLS. It's a system-level
// configuration managed only by an administrator through a trusted server environment.

export async function getIntegration(service: 'telegram'): Promise<ServiceResponse<TelegramCredentials | null>> {
  if (!supabaseAdmin) {
    const errorMsg = "Conexão administrativa com o banco de dados não está disponível.";
    console.error(errorMsg);
    return { data: null, error: errorMsg };
  }

  try {
    const { data, error } = await supabaseAdmin
        .from('telegram_integration')
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
  
  if(!supabaseAdmin) {
    const errorMsg = "Conexão administrativa com o banco de dados não está disponível para salvar.";
    console.error(errorMsg);
    return { data: null, error: errorMsg };
  }

  try {
    const { data: updatedData, error } = await supabaseAdmin
        .from('telegram_integration')
        .upsert({
            id: 1, // Always update the same row
            bot_token: credentials.bot_token,
            chat_id: credentials.chat_id,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    
    return { data: updatedData as TelegramCredentials, error: null };

  } catch (err: any) {
     console.error(`Error updating integration for telegram:`, err);
    return { data: null, error: `Falha ao salvar credenciais para o Telegram.` };
  }
}
