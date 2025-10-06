// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  // Se o usuário está logado
  if (token) {
    // E tenta acessar uma página de autenticação, redireciona para o dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Se o usuário não está logado
  if (!token) {
    // E tenta acessar uma página protegida (e não é a landing page), redireciona para o login
    if (!isAuthPage && pathname !== '/') {
      const loginUrl = new URL('/login', request.url);
      // Mantém a URL de destino para redirecionamento após o login
      loginUrl.searchParams.set('callbackUrl', pathname);
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
    '/((?!api|_next/static|_next/image|assets|favicon.ico|Logo.png|debug-auth).*)',
  ],
};
