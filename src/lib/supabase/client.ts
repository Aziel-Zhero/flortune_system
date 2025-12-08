// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseAnonKey) {
    throw new Error('As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias. Verifique se elas estão configuradas corretamente no seu ambiente de produção (ex: Netlify, Vercel).');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Exporta uma única instância do cliente para ser usada em toda a aplicação.
export const supabase = createSupabaseClient();
