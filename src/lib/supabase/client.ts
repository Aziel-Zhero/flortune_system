
// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('===================================================================================');
console.log('[Supabase Client Env Check] Attempting to read environment variables...');
console.log('[Supabase Client Env Check] Raw NEXT_PUBLIC_SUPABASE_URL from process.env:', `"${supabaseUrlFromEnv}"`);
console.log('[Supabase Client Env Check] Raw NEXT_PUBLIC_SUPABASE_ANON_KEY from process.env:', supabaseAnonKeyFromEnv ? `Present (length ${supabaseAnonKeyFromEnv.length})` : 'MISSING or EMPTY');
console.log('===================================================================================');


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

let supabaseInstance: SupabaseClient;

try {
  console.log('[Supabase Client Attempting Create] FINAL URL being passed to createClient:', `"${supabaseUrl}"`);
  console.log('[Supabase Client Attempting Create] FINAL Anon Key being passed to createClient (status):', supabaseAnonKey.length > 0 ? `Present (length ${supabaseAnonKey.length}, starts with "${supabaseAnonKey.substring(0, 5)}...")` : 'EMPTY - THIS IS A PROBLEM!');

  if (supabaseAnonKey.length === 0) {
    const errMsg = "Supabase Anon Key is present but empty after trimming. Cannot initialize client.";
    console.error("🔴🔴🔴 " + errMsg + " 🔴🔴🔴");
    throw new Error(errMsg);
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  console.log('[Supabase Client Initialized Successfully! 🎉]');
} catch (error: any) {
  const detailedErrorMessage = `Supabase client initialization FAILED using URL: "${supabaseUrl}". Original error: ${error.message}`;
  console.error("🔴🔴🔴 CLIENT INITIALIZATION FAILED 🔴🔴🔴");
  console.error("🔴🔴🔴 " + detailedErrorMessage + " 🔴🔴🔴", error);
  throw new Error(detailedErrorMessage);
}

export const supabase: SupabaseClient = supabaseInstance;
