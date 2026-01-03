// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// A função foi tornada async para usar await no cookieStore.
export async function createClient() {
  // A Promise é resolvida aqui.
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // O método 'set' pode ser chamado de um Server Component, o que pode
            // gerar um erro em algumas versões do Next.js. Ignoramos se o middleware
            // estiver tratando a atualização da sessão.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // O método 'delete' (via set com valor vazio) pode ser chamado
            // de um Server Component. Ignoramos o erro.
          }
        },
      },
    }
  )
}
