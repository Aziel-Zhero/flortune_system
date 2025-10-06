// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  // Se o usuário está logado
  if (session) {
    // E tenta acessar uma página de autenticação, redireciona para o dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Caso contrário, permite o acesso
    return NextResponse.next();
  }

  // Se o usuário não está logado
  if (!session) {
    // E tenta acessar uma página protegida, redireciona para o login
    if (!isAuthPage && pathname !== '/') {
        const loginUrl = new URL('/login', request.url);
        // Mantém a URL de destino para redirecionamento após o login
        loginUrl.searchParams.set('callbackUrl', request.nextUrl.href);
        return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets
     * - favicon.ico
     * - Logo.png
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|Logo.png).*)',
  ],
};
