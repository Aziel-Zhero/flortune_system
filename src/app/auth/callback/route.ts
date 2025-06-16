
// src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers' // Importar cookies de next/headers

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Se "next" estiver nos parâmetros, use-o como URL de redirecionamento, caso contrário, padrão para /dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies() // Usar a função cookies() de next/headers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // A request para NextResponse.next() ou NextResponse.redirect() lerá desta cookieStore
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Os cookies de sessão devem ter sido definidos pela instância do cliente supabase acima
      // diretamente na cookieStore, que fará parte da resposta.
      return NextResponse.redirect(`${origin}${next}`)
    } else {
        console.error('Auth callback error (exchangeCodeForSession):', error.message);
        // Se houver um erro, redirecione para o login com uma mensagem de erro
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`);
    }
  } else {
    // Se nenhum código estiver presente, redirecione para o login com uma mensagem de erro
    console.error('Auth callback error: No code provided.');
    return NextResponse.redirect(`${origin}/login?error=auth_callback_no_code`);
  }
}
