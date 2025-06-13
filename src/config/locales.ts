// src/config/locales.ts
export const SUPPORTED_LOCALES = ['en', 'pt', 'es', 'fr', 'ja', 'zh'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = 'pt';
