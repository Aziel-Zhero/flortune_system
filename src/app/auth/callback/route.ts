// Este arquivo era específico para o fluxo de callback OAuth do Supabase Auth.
// Com a migração para NextAuth.js (Auth.js), este callback não é mais usado diretamente.
// O NextAuth.js gerencia seus próprios callbacks em /api/auth/callback/[provider].
// Este arquivo pode ser deletado do seu projeto.
import { NextResponse } from 'next/server';

export async function GET() {
  // Pode redirecionar para uma página de erro ou para o login,
  // já que este endpoint não deve mais ser atingido.
  const url = new URL('/login?error=obsolete_callback', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003');
  return NextResponse.redirect(url);
}

    