// src/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // IMPORTANTE: Não modifique request.cookies diretamente
          // Apenas atualize a response
          response.cookies.set({
            name,
            value,
            ...options,
            // Adicione estas opções para garantir que as cookies sejam persistidas
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: CookieOptions) {
          // Para remover uma cookie, defina maxAge: 0
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        },
      },
    }
  )

  // IMPORTANTE: Verifique a sessão do usuário
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Opcional: Adicione lógica para redirecionar usuários não autenticados
  // Exemplo:
  // if (error || !user) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return response
}