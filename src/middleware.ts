
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Criar uma resposta baseada na requisição atual para poder modificar seus cookies.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // console.log(`Middleware: Handling request for ${request.nextUrl.pathname}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // console.log(`Middleware: Cookie GET: ${name}`);
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // console.log(`Middleware: Cookie SET on RESPONSE: ${name}`);
          // Os cookies devem ser definidos no objeto de resposta para serem enviados de volta ao navegador.
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          // console.log(`Middleware: Cookie REMOVE on RESPONSE: ${name}`);
          // Os cookies devem ser removidos do objeto de resposta.
          response.cookies.set(name, '', options);
        },
      },
    }
  );

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(`Middleware: Error getting session: ${sessionError.message}`);
    // Em caso de erro ao obter a sessão, é mais seguro redirecionar para o login.
    // No entanto, se o erro for transitório, isso pode ser agressivo.
    // Por enquanto, se houver erro, vamos tratar como se não houvesse sessão.
  }

  // console.log(`Middleware: Session state for ${request.nextUrl.pathname}: ${session ? `User ID ${session.user.id}` : 'No session'}`);

  const { pathname } = request.nextUrl;

  const authRoutes = ['/login', '/signup']; // Rotas de autenticação
  const callbackRoute = '/auth/callback'; // Rota de callback
  const publicLandingPage = '/'; // Landing page pública

  // Se o usuário está logado e tenta acessar /login ou /signup, redireciona para o dashboard
  if (session && authRoutes.includes(pathname)) {
    // console.log(`Middleware: User with session trying to access auth route ${pathname}. Redirecting to /dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Determinar se a rota é protegida
  const isAuthRoute = authRoutes.includes(pathname);
  const isCallbackRoute = pathname === callbackRoute;
  const isPublicLanding = pathname === publicLandingPage;
  
  // Rotas que não precisam de verificação de sessão (além das de autenticação, callback e landing)
  const publicAssetOrApiRoute = pathname.startsWith('/_next') || 
                                pathname.startsWith('/api') || 
                                /\.(png|jpg|jpeg|gif|svg|ico)$/i.test(pathname);

  const isProtectedRoute = !isAuthRoute && !isCallbackRoute && !isPublicLanding && !publicAssetOrApiRoute;


  // Se não há sessão e o usuário tenta acessar uma rota protegida, redireciona para o login
  if (!session && isProtectedRoute) {
    // console.log(`Middleware: No session and trying to access protected route ${pathname}. Redirecting to /login.`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // console.log(`Middleware: Allowing request for ${request.nextUrl.pathname}`);
  return response; // Retorna a resposta (possivelmente com cookies modificados)
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (rotas de API do Next.js, não necessariamente do Supabase)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - assets (se você tiver uma pasta /public/assets)
     * - arquivos com extensão (ex: .png, .jpg, .svg) na raiz de /public (como favicon.ico)
     */
    '/((?!api/|_next/static|_next/image|assets/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)',
    '/', // Inclui a landing page no matcher para que o middleware também a processe (ex: para redirecionar se logado)
  ],
};
