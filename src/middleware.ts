import createMiddleware from 'next-intl/middleware';
// Ajusta o caminho para importar de 'next-intl.config.ts' que está na raiz do projeto.
import intlConfig from '../next-intl.config';

export default createMiddleware({
  locales: intlConfig.locales,
  defaultLocale: intlConfig.defaultLocale,
  localePrefix: 'as-needed' // Mantém a configuração de prefixo de localidade
});

export const config = {
  // Ajusta o matcher para incluir todas as localidades configuradas
  // e também para servir a raiz da aplicação.
  // O localePrefix: 'as-needed' cuidará do redirecionamento da raiz para a localidade padrão.
  matcher: ['/', `/(${intlConfig.locales.join('|')})/:path*`, '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)']
};
