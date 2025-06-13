// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
// Importa de um caminho relativo para robustez, assumindo que config/locales.ts está em src/config/locales.ts
import {SUPPORTED_LOCALES, type SupportedLocale} from './config/locales';

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig chamado. Parâmetro de localidade bruto: "${locale}"`);

  // Valida que o parâmetro `locale` de entrada é uma localidade suportada
  const typedLocale = locale as SupportedLocale;
  if (!SUPPORTED_LOCALES.includes(typedLocale)) {
    console.error(`[i18n.ts] Localidade inválida: "${typedLocale}". Localidades suportadas são: ${SUPPORTED_LOCALES.join(', ')}. Acionando notFound().`);
    notFound();
  }

  let messages;
  try {
    // Caminho relativo para os arquivos de mensagens
    const messagePath = `./messages/${typedLocale}.json`;
    console.log(`[i18n.ts] Tentando importar dinamicamente mensagens para a localidade: "${typedLocale}" de "${messagePath}"`);
    messages = (await import(/* @vite-ignore */ messagePath)).default;
    console.log(`[i18n.ts] Mensagens importadas com sucesso para a localidade: "${typedLocale}".`);
  } catch (error) {
    console.error(`[i18n.ts] Erro ao importar arquivo de mensagens para a localidade "${typedLocale}":`, error);
    // Este erro explícito significa que o arquivo de mensagem específico (por exemplo, en.json) não foi encontrado ou teve um problema.
    // Isso é diferente de "arquivo de configuração não encontrado".
    console.log(`[i18n.ts] Acionando notFound() devido a erro na importação de mensagens para a localidade "${typedLocale}".`);
    notFound();
  }

  return {
    messages
    // timeZone: 'Europe/Vienna', // Exemplo: Você pode definir um fuso horário padrão
    // now: new Date(), // Exemplo: Você pode fornecer uma data para formatação consistente
    // formats: { ... } // Exemplo: Formatos personalizados
  };
});
