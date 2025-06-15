// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  const errorMessage = 'Supabase URL is missing. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.';
  console.error(errorMessage);
  throw new Error(errorMessage);
}
if (!supabaseAnonKey) {
  const errorMessage = 'Supabase Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.';
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Tipo explícito para o cliente Supabase
export const supabase: SupabaseClient = createClient(
  supabaseUrl, 
  supabaseAnonKey
);
