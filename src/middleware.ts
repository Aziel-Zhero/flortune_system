
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

  // If the user is logged in
  if (token) {
    // And tries to access an auth page, redirect to the dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow the request
    return NextResponse.next();
  }

  // If the user is not logged in
  if (!token) {
    // And tries to access a protected page (that is not the landing page), redirect to login
    if (!isAuthPage && pathname !== '/') {
      const loginUrl = new URL('/login', request.url);
      // Keep the destination URL for redirection after login
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
     * - debug-auth (our debug route)
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|Logo.png|debug-auth).*)',
  ],
};
