// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // A função updateSession do Supabase Auth Helper irá gerenciar a sessão do usuário,
  // atualizando o cookie da sessão se necessário.
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto os que começam com:
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de ícone)
     * - / (a página inicial pública)
     * O objetivo é executar o middleware em todas as rotas protegidas
     * e rotas de API, mas não em recursos estáticos.
     */
    '/((?!_next/static|_next/image|favicon.ico|/).*)',
  ],
};
