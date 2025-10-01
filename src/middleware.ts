// src/middleware.ts
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const authRoutes = ['/login', '/signup'];
  const isPublicRoute = authRoutes.includes(pathname) || pathname === '/';

  // If the user is logged in and tries to access login/signup, redirect to dashboard
  if (session && isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the user is not logged in and tries to access a protected route
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
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
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico).*)',
  ],
};
