
// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Mesmo com NextAuth para autenticação, podemos continuar usando o cliente Supabase para interagir com o banco de dados.
// As políticas RLS precisarão ser ajustadas se você quiser segurança em nível de linha baseada na sessão NextAuth.

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initial raw logging to see what's coming directly from process.env
console.log('[Supabase Client Env Check] Raw NEXT_PUBLIC_SUPABASE_URL:', supabaseUrlFromEnv);
console.log('[Supabase Client Env Check] Raw NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKeyFromEnv);

if (!supabaseUrlFromEnv || typeof supabaseUrlFromEnv !== 'string' || supabaseUrlFromEnv.trim() === '' || supabaseUrlFromEnv.includes('<SEU_PROJECT_REF>')) {
  const errorMessage = `CRITICAL ERROR: Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is missing, empty, not a string, or still contains the placeholder "<SEU_PROJECT_REF>". Current value: "${supabaseUrlFromEnv}". Please check your .env file or environment variables. It must be a complete URL, e.g., "https://your-actual-project-ref.supabase.co".`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

if (!supabaseAnonKeyFromEnv || typeof supabaseAnonKeyFromEnv !== 'string' || supabaseAnonKeyFromEnv.trim() === '') {
  const errorMessage = `CRITICAL ERROR: Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing, empty, or not a string. Current value: "${supabaseAnonKeyFromEnv}". Please check your .env file or environment variables.`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Use trimmed values
const supabaseUrl: string = supabaseUrlFromEnv.trim();
const supabaseAnonKey: string = supabaseAnonKeyFromEnv.trim();

let supabaseInstance: SupabaseClient;

try {
  // Log the exact values being passed to createClient after processing
  console.log('[Supabase Client Attempting Create] URL being passed to createClient:', `"${supabaseUrl}"`);
  // For the anon key, log its presence and a snippet for privacy, but confirm it's not empty.
  console.log('[Supabase Client Attempting Create] Anon Key being passed to createClient (status):', supabaseAnonKey.length > 0 ? `Present (length ${supabaseAnonKey.length}, starts with "${supabaseAnonKey.substring(0, 5)}...")` : 'EMPTY - THIS IS A PROBLEM!');
  
  if (supabaseAnonKey.length === 0) { // Explicit check for empty key after trim
    throw new Error("Supabase Anon Key is present but empty after trimming.");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  console.log('[Supabase Client Initialized Successfully]');
} catch (error: any) {
  // Provide a more detailed error message including the URL that failed
  const detailedErrorMessage = `Supabase client initialization failed. URL attempted: "${supabaseUrl}". Original error: ${error.message}`;
  console.error(`[Supabase Client Initialization Error] ${detailedErrorMessage}`, error);
  throw new Error(detailedErrorMessage);
}

export const supabase: SupabaseClient = supabaseInstance;
