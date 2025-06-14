// middleware.ts
import createMiddleware from 'next-intl/middleware';
// Não vamos mais importar intlConfig dinamicamente para o objeto config
// import intlConfig from '../next-intl.config'; // Removido para o matcher estático

// Defina suas localidades diretamente aqui para o matcher
const locales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'];
const defaultLocale = 'pt';

export default createMiddleware({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: 'as-needed'
});

export const config = {
  // Use uma string literal para o matcher com as localidades hardcodadas
  matcher: ['/', `/(${locales.join('|')})/:path*`, '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)']
};