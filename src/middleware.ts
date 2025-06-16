
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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
          // Cookies should be set on the response object to be sent back to the browser
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          // console.log(`Middleware: Cookie REMOVE on RESPONSE: ${name}`);
          // Cookies should be removed from the response object
          response.cookies.set(name, '', options);
        },
      },
    }
  );

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(`Middleware: Error getting session: ${sessionError.message}`);
    // Decide how to handle session errors, e.g., redirect to login or an error page
  }

  // console.log(`Middleware: Session state for ${request.nextUrl.pathname}: ${session ? `User ID ${session.user.id}` : 'No session'}`);

  const { pathname } = request.nextUrl;

  const authRoutes = ['/login', '/signup', '/auth/callback'];
  const publicLandingPage = '/';

  if (session && authRoutes.includes(pathname)) {
    // console.log(`Middleware: User with session trying to access auth route ${pathname}. Redirecting to /dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isProtectedRoute = !authRoutes.includes(pathname) && pathname !== publicLandingPage &&
                           !pathname.startsWith('/_next') && 
                           !pathname.startsWith('/icon.svg') && 
                           !pathname.startsWith('/api') &&
                           !pathname.endsWith('.png') && // Allow image assets
                           !pathname.endsWith('.jpg') &&
                           !pathname.endsWith('.jpeg') &&
                           !pathname.endsWith('.gif') &&
                           !pathname.endsWith('.svg'); // Allow SVG assets (like favicon if not under /icon.svg)


  if (!session && isProtectedRoute) {
    // console.log(`Middleware: No session and trying to access protected route ${pathname}. Redirecting to /login.`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // console.log(`Middleware: Allowing request for ${request.nextUrl.pathname}`);
  return response;
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - assets (se você tiver uma pasta /public/assets)
     * - arquivos com extensão (ex: .png, .jpg, .svg) na raiz de /public
     */
    '/((?!api|_next/static|_next/image|assets/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)',
    '/', 
  ],
};
