
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
// Mesmo com NextAuth para autenticação, podemos continuar usando o cliente Supabase para interagir com o banco de dados.
// As políticas RLS precisarão ser ajustadas se você quiser segurança em nível de linha baseada na sessão NextAuth.
export const supabase: SupabaseClient = createClient(
  supabaseUrl, 
  supabaseAnonKey
  // Se você for usar RLS com NextAuth, precisará passar o token JWT do NextAuth aqui
  // nas opções globais de headers, mas isso é um passo avançado.
  // Exemplo:
  // {
  //   global: {
  //     headers: { Authorization: `Bearer ${nextAuthSessionToken}` },
  //   },
  // }
);
