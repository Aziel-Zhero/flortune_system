// src/middleware.ts
console.log('[middleware.ts] MODULE EXECUTION START - This should appear ONCE on server start/restart.');
import createMiddleware from 'next-intl/middleware';

// All client components and server actions from `next-intl`
// use the locale of the current request.
// The middleware is responsible for serving the right content.
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'pt', 'es', 'fr', 'ja', 'zh'],

  // Used when no locale matches
  defaultLocale: 'pt',
  
  // Always use a locale prefix (e.g. `/pt/dashboard`)
  // localePrefix: 'always', // Use 'always' or 'as-needed'
  localePrefix: 'as-needed' // More common for cleaner URLs for default locale
});

export const config = {
  // Match only internationalized pathnames
  // This simplified matcher is often sufficient if `localePrefix` handles the heavy lifting.
  // It excludes API routes, Next.js internals, static files, and specific files like favicons.
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
    // If your root path should not be localized or should redirect, handle that logic
    // in your root page.tsx or adjust the matcher.
    // For `localePrefix: 'as-needed'`, the root path will typically redirect.
     '/',
  ]
};
