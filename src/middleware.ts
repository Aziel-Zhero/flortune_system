import { NextResponse, type NextRequest } from 'next/server';

// Dev Note: Authentication is temporarily bypassed for easier prototyping.
// Re-enable the commented out logic below to restore route protection.

export async function middleware(request: NextRequest) {
  // Bypassing all authentication checks.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets (if you have a /public/assets folder)
     * - favicon.ico (or any other file extensions in /public)
     */
    '/((?!_next/static|_next/image|assets/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)',
    '/',
  ],
};

/*
// --- ORIGINAL AUTHENTICATION LOGIC (DISABLED FOR PROTOTYPING) ---
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const authRoutes = ['/login', '/signup'];
  const publicLandingPage = '/';

  // If the user is logged in and tries to access /login or /signup, redirect to the dashboard
  if (session && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Routes that do not need session verification
  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicLanding = pathname === publicLandingPage;
  const publicAssetOrApiRoute =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') || // Allow NextAuth routes
    pathname.startsWith('/api/weather') || // Allow public weather API
    /\.(png|jpg|jpeg|gif|svg|ico)$/i.test(pathname);

  const isProtectedRoute = !isAuthRoute && !isPublicLanding && !publicAssetOrApiRoute;

  // If there is no session and the user tries to access a protected route, redirect to login
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname); // Optional: to redirect back after login
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
*/
