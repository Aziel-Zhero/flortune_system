// src/app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Se 'next' estiver no searchParams, use-o como a URL de redirecionamento,
  // senão, redirecione para a página inicial.
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
        // Redireciona para o dashboard após login/cadastro bem-sucedido
        return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redireciona para a página de erro se algo der errado
  console.error("Authentication callback error");
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
