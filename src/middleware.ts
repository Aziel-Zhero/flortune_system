import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'pt', 'es', 'fr', 'ja', 'zh'],
  defaultLocale: 'pt',
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  // Skip paths like /api, /_next, /icon.svg, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)']
};
