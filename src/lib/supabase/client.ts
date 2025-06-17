
// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Session } from 'next-auth'; // Para usar o supabaseAccessToken

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// console.log('===================================================================================');
// console.log('[Supabase Client Env Check] Attempting to read environment variables...');
// console.log('[Supabase Client Env Check] Raw NEXT_PUBLIC_SUPABASE_URL from process.env:', `"${supabaseUrlFromEnv}"`);
// console.log('[Supabase Client Env Check] Raw NEXT_PUBLIC_SUPABASE_ANON_KEY from process.env:', supabaseAnonKeyFromEnv ? `Present (length ${supabaseAnonKeyFromEnv.length})` : 'MISSING or EMPTY');
// console.log('===================================================================================');


if (!supabaseUrlFromEnv || typeof supabaseUrlFromEnv !== 'string' || supabaseUrlFromEnv.trim() === '' || supabaseUrlFromEnv.includes('<SEU_PROJECT_REF>')) {
  const errorMessage = `CRITICAL ERROR: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is missing, empty, not a string, or still contains the placeholder "<SEU_PROJECT_REF>". Current value: "${supabaseUrlFromEnv}". Please check your .env file or environment variables. It must be a complete URL, e.g., "https://your-actual-project-ref.supabase.co".`;
  console.error("🔴🔴🔴 CONFIGURATION ISSUE DETECTED 🔴🔴🔴");
  console.error("🔴🔴🔴 " + errorMessage + " 🔴🔴🔴");
  console.error("🔴🔴🔴 Please CORRECT the NEXT_PUBLIC_SUPABASE_URL in your .env file and RESTART your server. 🔴🔴🔴");
  throw new Error(errorMessage);
}

if (!supabaseAnonKeyFromEnv || typeof supabaseAnonKeyFromEnv !== 'string' || supabaseAnonKeyFromEnv.trim() === '') {
  const errorMessage = `CRITICAL ERROR: Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing, empty, or not a string. Current value: "${supabaseAnonKeyFromEnv}". Please check your .env file or environment variables.`;
  console.error("🔴🔴🔴 CONFIGURATION ISSUE DETECTED 🔴🔴🔴");
  console.error("🔴🔴🔴 " + errorMessage + " 🔴🔴🔴");
  console.error("🔴🔴🔴 Please CORRECT the NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file and RESTART your server. 🔴🔴🔴");
  throw new Error(errorMessage);
}

const supabaseUrl: string = supabaseUrlFromEnv.trim();
const supabaseAnonKey: string = supabaseAnonKeyFromEnv.trim();

// Cliente Supabase padrão (usa anon key) - para operações não autenticadas ou antes da sessão estar disponível
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// console.log('[Supabase Client Global Initialized Successfully! 🎉]');


// Função para criar um cliente Supabase que usa o supabaseAccessToken da sessão NextAuth
// Isso é útil para interagir com tabelas que têm RLS baseada no usuário autenticado.
export function createSupabaseClientWithToken(session: Session | null): SupabaseClient {
  if (session?.supabaseAccessToken) {
    // console.log("[Supabase Client] Creating client with supabaseAccessToken.");
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseAccessToken}`,
        },
      },
    });
  }
  // console.log("[Supabase Client] No supabaseAccessToken in session, returning default client (anon key).");
  return supabase; // Retorna o cliente padrão (anon key) se não houver token
}
