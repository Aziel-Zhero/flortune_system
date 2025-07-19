// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Session } from 'next-auth';

// --- Helper function to check for valid URL ---
function isValidSupabaseUrl(url: string | undefined): url is string {
  return !!url && url.startsWith('http') && !url.includes('<');
}

// --- Initialize Supabase Client ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    "⚠️ WARNING: Supabase client not initialized. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are invalid or missing. Database features will fail."
  );
}

// --- Export the potentially null client ---
export const supabase = supabaseInstance;

// --- Function to create a client with a session token ---
export function createSupabaseClientWithToken(session: Session | null): SupabaseClient | null {
  if (!isValidSupabaseUrl(supabaseUrl) || !supabaseAnonKey) {
    // If the base client couldn't be created, this one can't either.
    return null;
  }

  if (session?.supabaseAccessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseAccessToken}`,
        },
      },
    });
  }
  // Return the shared instance if no session token is available
  return supabaseInstance;
}
