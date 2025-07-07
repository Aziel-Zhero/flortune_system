
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route'; // Importa o objeto auth do NextAuth

export async function middleware(request: NextRequest) {
  const session = await auth(); // Obtém a sessão usando NextAuth
  const { pathname } = request.nextUrl;

  const authRoutes = ['/login', '/signup'];
  const publicLandingPage = '/';

  // Se o usuário está logado e tenta acessar /login ou /signup, redireciona para o dashboard
  if (session && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Rotas que não precisam de verificação de sessão
  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicLanding = pathname === publicLandingPage;
  const publicAssetOrApiRoute = 
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') || // Permite as rotas do NextAuth
    pathname.startsWith('/api/weather') || // Permite que a API do clima seja pública
    /\.(png|jpg|jpeg|gif|svg|ico)$/i.test(pathname);

  const isProtectedRoute = !isAuthRoute && !isPublicLanding && !publicAssetOrApiRoute;

  // Se não há sessão e o usuário tenta acessar uma rota protegida, redireciona para o login
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname); // Opcional: para redirecionar de volta após login
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - assets (se você tiver uma pasta /public/assets)
     * - arquivos com extensão (ex: .png, .jpg, .svg) na raiz de /public (como favicon.ico)
     */
    '/((?!_next/static|_next/image|assets/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)',
    '/', 
  ],
};
