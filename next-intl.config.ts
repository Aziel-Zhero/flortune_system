// This file is intentionally left with only comments.
// For Next.js App Router, the configuration for next-intl (server-side)
// should primarily be in `src/i18n.ts` using `getRequestConfig`.
// The middleware (`src/middleware.ts`) defines its locale configuration directly.
//
// If this file `next-intl.config.ts` exists in the project root with actual exports,
// it might conflict with `src/i18n.ts` or lead to unexpected behavior with
// `next-intl`'s server-side functions like `getLocale()` or `getMessages()`.
//
// It is recommended to DELETE this file if you are using `src/i18n.ts`
// as your primary configuration method for the App Router.

/*
// Example of what MIGHT have been here, but is now handled by src/i18n.ts and src/middleware.ts:
export default {
  locales: ['en', 'pt', 'es', 'fr', 'ja', 'zh'],
  defaultLocale: 'pt',
  // Other configurations like getMessages, getTimeZone, etc.,
  // would typically be part of the getRequestConfig in src/i18n.ts.
};
*/
