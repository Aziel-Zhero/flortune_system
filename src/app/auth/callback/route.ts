
// src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname, hash } = new URL(request.url);
  const code = searchParams.get('code');
  // Se "next" estiver nos parâmetros, use-o como URL de redirecionamento, caso contrário, padrão para /dashboard
  const next = searchParams.get('next') ?? '/dashboard';

  console.log(`Auth Callback: Path=${pathname}, Code=${code || 'N/A'}, Hash=${hash ? 'present' : 'absent'}, Origin=${origin}, Next=${next}`);

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // console.log(`Auth Callback: Cookie GET: ${name}`);
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`Auth Callback: Cookie SET: ${name}, HttpOnly: ${options.httpOnly}, Path: ${options.path}`);
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error(`Auth Callback: Cookie SET error for ${name}:`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          console.log(`Auth Callback: Cookie REMOVE: ${name}`);
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.error(`Auth Callback: Cookie REMOVE error for ${name}:`, error);
          }
        },
      },
    }
  );

  if (code) { // Primarily for PKCE flow (e.g., email link authentication)
    console.log('Auth Callback: Processing code (PKCE/email link flow)...');
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log('Auth Callback: PKCE code exchanged successfully. Redirecting to:', `${origin}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Auth Callback: Error exchanging PKCE code:', error.message);
      // Adiciona a mensagem de erro específica ao redirecionamento para facilitar a depuração
      const errorMessage = error.message.includes('Email link is invalid or has expired') 
        ? 'Link de confirmação inválido ou expirado. Por favor, tente novamente.'
        : `Falha na troca do código: ${error.message}`;
      return NextResponse.redirect(`${origin}/login?error=pkce_exchange_failed&message=${encodeURIComponent(errorMessage)}`);
    }
  }

  // Attempt to handle OAuth flow (which might not have 'code' in searchParams but relies on hash fragment)
  console.log('Auth Callback: No code in searchParams, attempting to get session (OAuth flow or already logged in)...');
  // For OAuth, the Supabase client (when configured with cookie helpers) should handle the session
  // establishment from the URL fragment automatically upon calling `getSession` or similar methods.
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Auth Callback: Error getting session during OAuth flow:', sessionError.message);
    return NextResponse.redirect(`${origin}/login?error=session_retrieval_failed&message=${encodeURIComponent(`Erro ao obter sessão: ${sessionError.message}`)}`);
  }

  if (session) {
    console.log('Auth Callback: Session found/established via OAuth or existing. User ID:', session.user.id, 'Redirecting to:', `${origin}${next}`);
    // The cookies should have been set by the `getSession` call via the cookie helpers.
    return NextResponse.redirect(`${origin}${next}`);
  }

  // If no code in query and no session could be established (e.g. after OAuth attempt)
  console.warn('Auth Callback: No code in searchParams and no session established after OAuth attempt. URL:', request.url);
  return NextResponse.redirect(`${origin}/login?error=auth_failed_no_session&message=${encodeURIComponent('Falha na autenticação. Nenhuma sessão foi estabelecida.')}`);
}
