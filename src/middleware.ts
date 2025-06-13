import createMiddleware from 'next-intl/middleware';
import {SUPPORTED_LOCALES, DEFAULT_LOCALE} from '@/config/locales';

export default createMiddleware({
  locales: [...SUPPORTED_LOCALES], // Spread to ensure it's a new array if needed by middleware
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  // Skip paths like /api, /_next, /icon.svg, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)']
};
