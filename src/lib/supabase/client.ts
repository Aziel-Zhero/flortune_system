// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Supabase URL is missing from environment variables. Features requiring Supabase will not work.');
}
if (!supabaseAnonKey) {
  console.error('Supabase Anon Key is missing from environment variables. Features requiring Supabase will not work.');
}

// Provide a default value or handle the case where keys might be missing,
// though ideally, the app should not run without them if Supabase is critical.
// For now, we'll proceed, and Supabase operations will fail if keys are truly missing.
export const supabase = createClient(
  supabaseUrl || "missing_url", 
  supabaseAnonKey || "missing_key"
);

// Test basic client creation (optional)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase client initialized with placeholder values due to missing environment variables.");
}
