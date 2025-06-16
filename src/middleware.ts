
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Rotas públicas que não exigem autenticação (além da landing page)
  const authRoutes = ['/login', '/signup', '/auth/callback'];
  const publicLandingPage = '/';

  // Se o usuário está logado e tenta acessar /login ou /signup, redireciona para o dashboard
  if (session && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se o usuário não está logado e tenta acessar uma rota protegida
  // Rotas protegidas são todas que NÃO são authRoutes e NÃO são a landing page
  // e NÃO são assets ou rotas de API.
  const isProtectedRoute = !authRoutes.includes(pathname) && pathname !== publicLandingPage &&
                           !pathname.startsWith('/_next') && 
                           !pathname.startsWith('/icon.svg') && 
                           !pathname.startsWith('/api');

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // A landing page (/) é sempre acessível.
  // O redirecionamento de / para /dashboard ou /login foi removido daqui.
  // A própria página / cuidará de mostrar conteúdo diferente para usuários logados/deslogados.

  return response;
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - icon.svg (ícone do aplicativo)
     * - *.png, *.jpg, etc. (outros arquivos de imagem em /public)
     */
    '/((?!api|_next/static|_next/image|.*\\..*).*)',
    '/', // Inclui a rota raiz para ser processada pelo middleware
  ],
};
