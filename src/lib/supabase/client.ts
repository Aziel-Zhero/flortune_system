// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Helper function to check for valid URL ---
function isValidSupabaseUrl(url: string | undefined): url is string {
  return !!url && url.startsWith('http') && !url.includes('<');
}

let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient() {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey) {
        supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
        return supabaseInstance;
    } else {
      console.warn(
        "⚠️ WARNING: Supabase client not initialized. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are invalid or missing. Database features will fail."
      );
      return null;
    }
}

export const supabase = createSupabaseClient();
