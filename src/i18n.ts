// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Defina as localidades suportadas e a localidade padrão diretamente aqui
// para tornar este arquivo autossuficiente para a configuração do next-intl/server.
const SUPPORTED_LOCALES_CONFIG = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
type SupportedLocaleConfig = typeof SUPPORTED_LOCALES_CONFIG[number];
const DEFAULT_LOCALE_CONFIG: SupportedLocaleConfig = 'pt';

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig called for locale: "${locale}"`);
  const typedLocale = locale as SupportedLocaleConfig;

  if (!SUPPORTED_LOCALES_CONFIG.includes(typedLocale)) {
    console.warn(`[i18n.ts] Unsupported locale "${typedLocale}" requested. Calling notFound(). Supported: ${SUPPORTED_LOCALES_CONFIG.join(', ')}`);
    notFound();
  }

  try {
    // O caminho deve ser relativo à localização de i18n.ts (src/) para a pasta messages/ na raiz.
    const messages = (await import(`../messages/${typedLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for locale "${typedLocale}".`);
    return {
      messages,
      timeZone: 'UTC' // Opcional: defina um fuso horário se necessário
    };
  } catch (error) {
    console.error(`[i18n.ts] Critical error importing message file for locale "${typedLocale}":`, error);
    // Se o arquivo de mensagens para uma localidade suportada estiver faltando ou for inválido.
    notFound();
  }
});