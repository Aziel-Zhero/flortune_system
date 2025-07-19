
// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Session } from 'next-auth'; // Para usar o supabaseAccessToken

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrlFromEnv || typeof supabaseUrlFromEnv !== 'string' || supabaseUrlFromEnv.trim() === '' || supabaseUrlFromEnv.includes('<SEU_PROJECT_REF>')) {
  const errorMessage = `CRITICAL WARNING: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is missing, empty, not a string, or still contains the placeholder "<SEU_PROJECT_REF>". Current value: "${supabaseUrlFromEnv}". Please check your .env file or environment variables. It must be a complete URL, e.g., "https://your-actual-project-ref.supabase.co".`;
  console.error("🔴🔴🔴 CONFIGURATION ISSUE DETECTED 🔴🔴🔴");
  console.error("🔴🔴🔴 " + errorMessage + " 🔴🔴🔴");
}

if (!supabaseAnonKeyFromEnv || typeof supabaseAnonKeyFromEnv !== 'string' || supabaseAnonKeyFromEnv.trim() === '') {
  const errorMessage = `CRITICAL WARNING: Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing, empty, or not a string. Current value: "${supabaseAnonKeyFromEnv}". Please check your .env file or environment variables.`;
  console.error("🔴🔴🔴 CONFIGURATION ISSUE DETECTED 🔴🔴🔴");
  console.error("🔴🔴🔴 " + errorMessage + " 🔴🔴🔴");
}

const supabaseUrl: string = supabaseUrlFromEnv?.trim() || '';
const supabaseAnonKey: string = supabaseAnonKeyFromEnv?.trim() || '';

// Cliente Supabase padrão (usa anon key) - para operações não autenticadas ou antes da sessão estar disponível
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Função para criar um cliente Supabase que usa o supabaseAccessToken da sessão NextAuth
// Isso é útil para interagir com tabelas que têm RLS baseada no usuário autenticado.
export function createSupabaseClientWithToken(session: Session | null): SupabaseClient {
  if (session?.supabaseAccessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseAccessToken}`,
        },
      },
    });
  }
  return supabase; // Retorna o cliente padrão (anon key) se não houver token
}
