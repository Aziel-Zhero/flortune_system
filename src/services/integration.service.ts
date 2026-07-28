
// src/services/integration.service.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ServiceResponse } from "@/types/database.types";

interface TelegramCredentials {
    bot_token: string;
    chat_id: string;
    greeting_message?: string | null;
    history_message?: string | null;
    test_message?: string | null;
    updated_at?: string | null;
}

export async function getIntegration(service: 'telegram'): Promise<ServiceResponse<TelegramCredentials | null>> {
  if (!supabaseAdmin) {
    const errorMsg = "Conexão administrativa com o banco de dados não está disponível.";
    console.error(errorMsg);
    return { data: null, error: errorMsg };
  }

  try {
    const { data, error } = await supabaseAdmin
        .from('telegram')
        .select('bot_token, chat_id, greeting_message, history_message, test_message, updated_at')
        .eq('id', 1)
        .single();
        
    if (error) {
        if (error.code === 'PGRST116') return { data: null, error: null };
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
            return { data: null, error: "Tabela 'telegram' não encontrada. Verifique o schema SQL." };
        }
        throw error;
    }
    
    return { data: data as TelegramCredentials | null, error: null };

  } catch (err: any) {
    console.error(`Error fetching integration for ${service}:`, err);
    return { data: null, error: `Falha ao buscar credenciais para ${service}. ${err.message}` };
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
        .from('telegram')
        .upsert({
            id: 1,
            bot_token: credentials.bot_token,
            chat_id: credentials.chat_id,
            greeting_message: credentials.greeting_message,
            history_message: credentials.history_message,
            test_message: credentials.test_message,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
            throw new Error("A tabela 'telegram' não existe. Execute o script SQL no seu painel Supabase.");
        }
        throw error;
    }
    
    return { data: updatedData as TelegramCredentials, error: null };

  } catch (err: any) {
     console.error(`Error updating integration for telegram:`, err);
    return { data: null, error: err.message || "Falha ao salvar credenciais." };
  }
}
