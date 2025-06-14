// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

// Define locales and defaultLocale statically for the middleware.
const locales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
const defaultLocale = 'pt';

export default createMiddleware({
  locales: [...locales], // Ensure a new array instance is passed
  defaultLocale: defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - assets (static assets in public)
    // - favicon.ico (favicon file)
    // - icon.svg (icon file)
    '/((?!api|_next/static|_next/image|assets|favicon.ico|icon.svg).*)',
    // Match the root path specifically
    '/',
  ],
};
