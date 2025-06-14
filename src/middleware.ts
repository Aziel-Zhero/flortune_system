// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

// Define as localidades suportadas e a localidade padrão para a aplicação.
// Estas devem ser consistentes com o que está em src/config/locales.ts
// e usado em src/i18n.ts para carregar as mensagens.
const locales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'];
const defaultLocale = 'pt';

export default createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: 'as-needed'
});

export const config = {
  // O matcher DEVE ser estaticamente analisável.
  // Evite construí-lo dinamicamente com .join() se estiver causando problemas.
  matcher: [
    // Match all pathnames except for
    // - …component/api (API routes)
    // - …component/_next (Next.js internals)
    // - …component/_next/static (static files)
    // - …component/_next/image (image optimization files)
    // - …component/favicon.ico (favicon file)
    // - …component/icon.svg (icon file)
    // - / (the root path)
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)',
    // Match the root path specifically
    '/',
    // Match all pathnames within supported locales
    '/(en|pt|es|fr|ja|zh)/:path*'
  ]
};