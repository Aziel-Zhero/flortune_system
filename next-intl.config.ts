// next-intl.config.ts
// Define as localidades suportadas e a localidade padrão para a aplicação.
// Esta configuração é usada pelo middleware do next-intl.

// Importa as constantes de localidade do arquivo de configuração centralizado.
// Embora SUPPORTED_LOCALES e DEFAULT_LOCALE venham de @/config/locales,
// para este arquivo na raiz, usamos a definição direta ou ajustamos o caminho.
// Por simplicidade e para seguir o padrão de ter este arquivo autônomo,
// vamos definir as localidades diretamente aqui, espelhando o que está em src/config/locales.ts.

const locales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
const defaultLocale = 'pt';

export default {
  locales: locales,
  defaultLocale: defaultLocale,
};
