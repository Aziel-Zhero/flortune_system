// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

console.log('[i18n.ts] MODULE EXECUTION START (deve aparecer uma vez no início do servidor)');

// Defina as localidades suportadas e a padrão diretamente aqui.
const locales = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
type AppLocale = typeof locales[number];
const defaultLocale: AppLocale = 'pt';

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig CALLED for locale: "${locale}"`);

  // Use Intl.Locale para extrair a parte base da localidade de forma segura.
  // Ex: 'pt-BR' se torna 'pt'.
  let baseLocale: AppLocale;
  try {
    baseLocale = new Intl.Locale(locale).baseName as AppLocale;
  } catch (e) {
    console.error(`[i18n.ts] Invalid locale format: "${locale}". Falling back to default.`);
    baseLocale = defaultLocale;
  }

  // Valide se a localidade base é suportada.
  if (!locales.includes(baseLocale)) {
    console.warn(`[i18n.ts] Unsupported locale: "${baseLocale}". Triggering notFound().`);
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../messages/${baseLocale}.json`)).default;
    console.log(`[i18n.ts] Successfully loaded messages for locale: "${baseLocale}"`);
  } catch (error) {
    console.error(`[i18n.ts] FAILED to load messages for locale "${baseLocale}":`, error);
    // Se não conseguir carregar as mensagens, é uma condição de erro crítico.
    notFound();
  }

  return {
    messages,
    // Você pode configurar o fuso horário aqui se necessário
    // timeZone: 'America/New_York', 
  };
});
