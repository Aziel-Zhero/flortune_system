// src/middleware.ts
console.log('[middleware.ts] MODULE EXECUTION START - This should appear ONCE on server start/restart.');
import createMiddleware from 'next-intl/middleware';

// Defina as localidades e a padrão DIRETAMENTE AQUI para o middleware
const locales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
const defaultLocale: typeof locales[number] = 'pt';

export default createMiddleware({
  locales: [...locales], // Use spread para garantir que é um novo array se necessário
  defaultLocale: defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - …component/api (API routes)
    // - …component/_next (Next.js internals)
    // - …component/_next/static (static files)
    // - …component/_next/image (image optimization files)
    // - …component/favicon.ico (favicon file)
    // - …component/icon.svg (icon file)
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)',
    // Match the root path specifically if you want it to be handled by the middleware
     '/',
  ]
};