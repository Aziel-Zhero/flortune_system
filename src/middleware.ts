// src/middleware.ts
console.log('[middleware.ts] MODULE EXECUTION START - This should appear ONCE on server start/restart.');
import createMiddleware from 'next-intl/middleware';

// Define locales and defaultLocale directly for the middleware for clarity and static analysis
const middlewareLocales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
const middlewareDefaultLocale: typeof middlewareLocales[number] = 'pt';

export default createMiddleware({
  locales: [...middlewareLocales], // Pass a new array
  defaultLocale: middlewareDefaultLocale,
  localePrefix: 'as-needed', // Recommended: only adds prefix if not default
  // Ensure pathnames without a recognized locale are routed to the defaultLocale
  // and that requests for the defaultLocale don't get a prefix.
});

export const config = {
  // Matcher entries should cover all pages intended for internationalization
  // and exclude paths that should not be processed by the middleware.
  matcher: [
    // Match all pathnames except for
    // - …component/api (API routes)
    // - …component/_next (Next.js internals)
    // - …component/_next/static (static files)
    // - …component/_next/image (image optimization files)
    // - …component/assets (any other static assets in public folder)
    // - …component/favicon.ico (favicon file)
    // - …component/icon.svg (icon file)
    '/((?!api|_next/static|_next/image|assets|favicon.ico|icon.svg).*)',
    // Match the root path specifically if you want it to be handled by the middleware
     '/',
  ]
};
