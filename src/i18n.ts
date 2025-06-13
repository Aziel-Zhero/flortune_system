
import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // This is a minimal configuration for diagnostics.
  // It assumes `locale` is always valid and the message file exists.
  // The path './messages/${locale}.json' is relative from `src/i18n.ts`.
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
