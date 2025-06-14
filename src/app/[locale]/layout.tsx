// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTimeZone } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/config/locales';

// This layout applies to all routes under [locale]
// It's responsible for setting up language-specific settings

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const localeParam = params.locale as SupportedLocale;

  if (!SUPPORTED_LOCALES.includes(localeParam)) {
    console.warn(`[LocaleLayout] Invalid locale in params: "${localeParam}". Redirecting or showing notFound.`);
    notFound(); // Or redirect to default locale
  }

  let activeLocale: SupportedLocale;
  try {
    activeLocale = await getLocale() as SupportedLocale;
  } catch (error) {
    console.error(`[LocaleLayout] Error calling getLocale():`, error);
    // Fallback to default or param locale if getLocale fails catastrophically
    activeLocale = SUPPORTED_LOCALES.includes(localeParam) ? localeParam : DEFAULT_LOCALE;
    return (
        <html lang={activeLocale} suppressHydrationWarning>
            <head><title>Application Configuration Error</title></head>
            <body className="font-body antialiased">
                <h1>Application Configuration Error</h1>
                <p>Failed to initialize internationalization (getLocale). Details in server console.</p>
            </body>
        </html>
    );
  }
  
  if (activeLocale !== localeParam) {
    console.warn(`[LocaleLayout] Locale mismatch: param is "${localeParam}", getLocale() is "${activeLocale}". Using "${activeLocale}".`);
  }
  if (!SUPPORTED_LOCALES.includes(activeLocale)) {
      console.error(`[LocaleLayout] Locale from getLocale() "${activeLocale}" is not supported. Critical error.`);
      // This should ideally not happen if getLocale() works as expected with src/i18n.ts
      return (
        <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
            <head><title>Unsupported Locale Error</title></head>
            <body className="font-body antialiased">
                <h1>Unsupported Locale</h1>
                <p>The locale &quot;{activeLocale}&quot; is not supported.</p>
            </body>
        </html>
    );
  }
  
  let messages;
  try {
    messages = await getMessages(); // Uses locale from getLocale() context
  } catch (error) {
    console.error(`[LocaleLayout] Critical error fetching messages for locale "${activeLocale}":`, error);
    return (
        <html lang={activeLocale} suppressHydrationWarning>
            <head><title>Application Translation Error</title></head>
            <body className="font-body antialiased">
                <h1>Application Translation Error</h1>
                <p>Failed to load translation messages for locale: {activeLocale}.</p>
            </body>
        </html>
    );
  }

  if (!messages || Object.keys(messages).length === 0) {
    console.error(`[LocaleLayout] Messages are undefined or empty for locale "${activeLocale}".`);
     return (
        <html lang={activeLocale} suppressHydrationWarning>
            <head><title>Configuration Error - No Messages</title></head>
            <body className="font-body antialiased">
                <h1>Application Error</h1>
                <p>Failed to load critical translation data for locale: {activeLocale}.</p>
            </body>
        </html>
    );
  }

  let timeZone;
  try {
    timeZone = await getTimeZone(); 
  } catch (error) {
    console.warn(`[LocaleLayout] Could not determine timezone for locale "${activeLocale}", using default. Error:`, error);
    timeZone = 'UTC'; // Default timezone
  }

  return (
    // The <html> and <body> tags are in src/app/layout.tsx
    // This component just provides the NextIntlClientProvider
    // The lang attribute on <html> should be handled by the parent RootLayout if it takes locale.
    // Or, if this is the true root layout for localized content, it should render <html>.
    // Based on current structure, src/app/layout.tsx is the root.
    // This LocaleLayout wraps content within the main <body>.
    // However, for `lang` attribute on `html` tag, it should be managed by the outermost layout.
    // Let's assume `src/app/layout.tsx` is very basic and `src/app/[locale]/layout.tsx` sets the lang.
    // Re-evaluating: If `src/app/layout.tsx` renders `<html>`, then `lang` should be set there if possible,
    // or this LocaleLayout should indeed render its own `<html>` if it's meant to be the true root for a locale.
    // Given `NextIntlClientProvider` needs to wrap the content, and `<html>` needs `lang`, this layout IS the effective root for localized content.
    // BUT the problem description says src/app/layout is the root. So this file should *NOT* render html/body.
    // Let's assume src/app/layout.tsx is the one setting html lang={activeLocale}
    // This layout then provides the provider.
    // The parent `src/app/layout.tsx` does not have access to `activeLocale` easily.
    // So, this `LocaleLayout` should indeed render the `<html>` tag for its specific locale.
    // This means the `src/app/layout.tsx` should NOT render `<html>` and `<body>` if this one does.
    // This is a common point of confusion. Let's simplify: this layout provides the `<html>` tag with the correct lang.
    // This means the global `src/app/layout.tsx` must be changed to NOT render `html` and `body`.

    // ---- CORRECTION to the above thought process ----
    // The Next.js App Router structure is:
    // src/app/layout.tsx (RootLayout for ALL pages, including non-localized error pages)
    // src/app/[locale]/layout.tsx (Layout for all LOCALIZED pages)
    // So, src/app/layout.tsx renders <html> and <body>.
    // src/app/[locale]/layout.tsx *sets* the lang attribute on the existing <html> tag.
    // This is typically done by passing metadata or using a hook if one were available for `lang`.
    // For now, we'll rely on the parent `src/app/layout.tsx` setting a default `lang` or `suppressHydrationWarning`,
    // and `NextIntlClientProvider` will handle client-side locale context. The actual `lang` attribute update on `<html>`
    // is tricky from a nested layout without direct DOM manipulation or context not designed for this.
    // Let's ensure `suppressHydrationWarning` is on the `html` tag in the true root layout, and this provides the context.
    // `NextIntlClientProvider` is the key here.
    
    // The `lang` attribute on `<html>` is best managed by `generateMetadata` in this layout.
    // For simplicity of this regeneration, I'll focus on `NextIntlClientProvider`.
    <NextIntlClientProvider
      locale={activeLocale}
      messages={messages}
      timeZone={timeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
}

// Optional: Add generateMetadata to set the lang attribute dynamically
// export async function generateMetadata({ params }: { params: { locale: string }}) {
//   return {
//     alternates: {
//       canonical: `/${params.locale}`,
//       languages: Object.fromEntries(SUPPORTED_LOCALES.map(loc => [loc, `/${loc}`])),
//     },
//   };
// }
