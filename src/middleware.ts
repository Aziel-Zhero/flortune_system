
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

// Middleware foi desativado para permitir acesso direto sem autenticação.
// A lógica anterior foi comentada para referência futura.
export function middleware(request: NextRequest) {
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
     * - debug-auth
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|Logo.png|debug-auth).*)',
  ],
};
