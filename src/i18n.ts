// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SUPPORTED_LOCALES, type SupportedLocale} from './config/locales';

// O parâmetro 'locale' é fornecido por next-intl. É a string da localidade resolvida atualmente.
export default getRequestConfig(async ({locale: localeParam}: {locale: string}) => {
  // Valida se o parâmetro 'localeParam' recebido é uma localidade suportada válida.
  // Fazemos o cast de 'localeParam' para 'SupportedLocale' para a verificação,
  // pois .includes espera elementos do mesmo tipo do array.
  if (!SUPPORTED_LOCALES.includes(localeParam as SupportedLocale)) {
    console.error(`[i18n.ts] Localidade não suportada: "${localeParam}". Localidades suportadas são: ${SUPPORTED_LOCALES.join(', ')}.`);
    notFound();
  }

  // Agora que validamos, podemos usá-lo com segurança como SupportedLocale.
  const currentValidatedLocale = localeParam as SupportedLocale;

  try {
    return {
      messages: (await import(`./messages/${currentValidatedLocale}.json`)).default
    };
  } catch (error) {
    console.error(`[i18n.ts] Erro ao carregar mensagens para a localidade "${currentValidatedLocale}":`, error);
    // Isso pode acontecer se o arquivo .json estiver faltando ou malformado.
    notFound();
  }
});
