// src/lib/supabase/admin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// --- Helper function to check for valid URL ---
function isValidSupabaseUrl(url: string | undefined): url is string {
  return !!url && url.startsWith('http') && !url.includes('<');
}

// --- Initialize Supabase Admin Client ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdminInstance: SupabaseClient | null = null;

if (isValidSupabaseUrl(supabaseUrl) && supabaseServiceRoleKey) {
  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
  });
} else {
  console.warn(
    "⚠️ WARNING: Supabase Admin Client not initialized. Server-side actions requiring admin privileges will fail."
  );
}

// --- Export the potentially null client ---
export const supabaseAdmin = supabaseAdminInstance as SupabaseClient;
