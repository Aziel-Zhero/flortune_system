
// src/app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

/**
 * Rota de callback para autenticação via provedores externos (Google, GitHub, etc.)
 * Esta rota troca o código temporário fornecido pelo Supabase por uma sessão real do usuário.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Se 'next' estiver presente, redireciona para lá após o login, senão vai para o dashboard
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirecionamento seguro pós-login
      const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/dashboard`;
      return NextResponse.redirect(redirectUrl);
    }
    
    console.error("Erro ao trocar código por sessão:", error.message);
  }

  // Redireciona para a página de login com erro se algo falhar
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
