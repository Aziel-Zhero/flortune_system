// src/services/integration.service.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { auth } from "@/lib/auth";
import type { ServiceResponse } from "@/types/database.types";

interface TelegramCredentials {
    bot_token: string;
    chat_id: string;
}

interface Integration<T> {
  service: string;
  credentials: T;
}

// Verifica se o usuário autenticado é um administrador.
async function isAdmin() {
  const session = await auth();
  // Se não houver sessão ou perfil, não é admin.
  if (!session?.user?.profile) return false;
  // A role 'admin' é definida no momento do login do admin.
  return session.user.profile.role === 'admin';
}

export async function getIntegration(service: 'telegram'): Promise<ServiceResponse<Integration<TelegramCredentials> | null>> {
  if (!await isAdmin()) {
    return { data: null, error: "Acesso não autorizado." };
  }
  
  if(!supabaseAdmin) {
    return { data: null, error: "Conexão com o banco de dados não disponível." };
  }

  try {
    const { data, error } = await supabaseAdmin
        .from('integrations')
        .select('credentials')
        .eq('service_name', service)
        .single();
        
    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found, which is not a critical error
        throw error;
    }
    
    if (data) {
        return { data: { service, credentials: data.credentials as TelegramCredentials }, error: null };
    } else {
        // Retorna credenciais vazias se não houver registro, para preencher o formulário
        return { data: { service, credentials: { bot_token: '', chat_id: ''} }, error: null };
    }

  } catch (err: any) {
    console.error(`Error fetching integration for ${service}:`, err);
    return { data: null, error: `Falha ao buscar credenciais para ${service}.` };
  }
}

export async function updateIntegration(data: Integration<TelegramCredentials>): Promise<ServiceResponse<Integration<TelegramCredentials>>> {
  if (!await isAdmin()) {
    return { data: null, error: "Acesso não autorizado." };
  }
  
  if(!supabaseAdmin) {
    return { data: null, error: "Conexão com o banco de dados não disponível." };
  }

  const { service, credentials } = data;

  try {
    const { data: updatedData, error } = await supabaseAdmin
        .from('integrations')
        .upsert({
            service_name: service,
            credentials,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    
    return { data: { service, credentials: updatedData.credentials as TelegramCredentials }, error: null };

  } catch (err: any) {
     console.error(`Error updating integration for ${service}:`, err);
    return { data: null, error: `Falha ao salvar credenciais para ${service}.` };
  }
}
