// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Funcao para criar uma instancia UNICA do cliente supabase para o browser
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseAnonKey) {
    // Lanca um erro claro se as variaveis de ambiente nao estiverem configuradas
    throw new Error('As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias. Verifique se elas estão configuradas corretamente no seu ambiente.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Exporta a instancia unica do cliente para ser usada em toda a aplicacao.
export const supabase = createSupabaseClient();
