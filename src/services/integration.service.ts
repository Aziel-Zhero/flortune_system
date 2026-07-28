
// src/services/integration.service.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ServiceResponse } from "@/types/database.types";

interface TelegramCredentials {
    bot_token: string;
    chat_id: string;
    updated_at?: string | null;
}

const DEFAULT_TELEGRAM_GREETING = 'Olá! Sou o bot do Flortune e estarei aqui para te ajudar com notificações importantes.';
const DEFAULT_TELEGRAM_TEST = 'Esta é uma mensagem de teste enviada pelo Flortune via Telegram.';

export async function getIntegration(service: 'telegram'): Promise<ServiceResponse<TelegramCredentials | null>> {
  if (!supabaseAdmin) {
    const errorMsg = "Conexão administrativa com o banco de dados não está disponível.";
    console.error(errorMsg);
    return { data: null, error: errorMsg };
  }

  try {
    const { data, error } = await supabaseAdmin
        .from('telegram')
        .select('bot_token, chat_id, updated_at')
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
    const message = err.message || "Falha ao salvar credenciais.";
    if (message.includes('greeting_message') || message.includes('history_message') || message.includes('test_message')) {
      return { data: null, error: "A tabela 'telegram' precisa conter bot_token e chat_id. Atualize o schema usando docs/database_schema.sql." };
    }
    return { data: null, error: message };
  }
}

export type TelegramMessageAction = 'greeting' | 'history' | 'test' | 'custom';

export async function sendTelegramMessage(action: TelegramMessageAction, customText?: string): Promise<ServiceResponse<null>> {
  if (!supabaseAdmin) {
    const errorMsg = "Conexão administrativa com o banco de dados não está disponível para enviar Telegram.";
    console.error(errorMsg);
    return { data: null, error: errorMsg };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('telegram')
      .select('bot_token, chat_id')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return { data: null, error: "Tabela 'telegram' não encontrada. Execute o script SQL no seu painel Supabase." };
      }
      throw error;
    }

    const botToken = data?.bot_token;
    const chatId = data?.chat_id;
    if (!botToken || !chatId) {
      return { data: null, error: "O token do bot e o Chat ID precisam estar configurados para enviar mensagens." };
    }

    let text = '';
    if (action === 'greeting') {
      text = DEFAULT_TELEGRAM_GREETING;
    } else if (action === 'test') {
      text = customText?.trim() || DEFAULT_TELEGRAM_TEST;
    } else if (action === 'custom') {
      text = customText?.trim() || '';
    }

    if (!text) {
      return { data: null, error: "A mensagem está vazia. Configure a mensagem no Telegram ou informe uma mensagem customizada." };
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });

    const result = await response.json();
    if (!response.ok || result.ok === false) {
      throw new Error(result.description || 'Falha ao enviar a mensagem pelo Telegram.');
    }

    return { data: null, error: null };
  } catch (err: any) {
    console.error(`Error sending Telegram message:`, err);
    return { data: null, error: err.message || 'Falha ao enviar a mensagem pelo Telegram.' };
  }
}
