
// src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in params, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard' // Default to dashboard

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            // O NextResponse abaixo cuidará de definir o cookie na resposta
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            // O NextResponse abaixo cuidará de definir o cookie na resposta
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`)
      // É crucial definir os cookies na RESPOSTA que vai para o navegador.
      // As operações de cookie no objeto 'request' dentro do createServerClient
      // são para ler os cookies da solicitação recebida.
      // As operações de cookie no objeto 'response' (que será retornado)
      // são para enviar os cookies de volta ao navegador.
      // O Supabase SSR helper deve lidar com isso se response.cookies.set for chamado por ele.
      // Re-instanciamos o supabase com o objeto de resposta para que ele possa definir os cookies.
       createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) { return request.cookies.get(name)?.value },
            set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }) },
            remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: '', ...options }) },
          },
        }
      )
      return response;
    } else {
        console.error('Auth callback error (exchangeCodeForSession):', error.message);
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`);
    }
  } else {
    console.error('Auth callback error: No code provided.');
    return NextResponse.redirect(`${origin}/login?error=auth_callback_no_code`);
  }
}
