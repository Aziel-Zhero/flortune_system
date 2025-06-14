import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'AuthLayout'});
  return {
    title: `${t('loginTitle')} - ${APP_NAME}`,
  };
}

export default async function LoginPage({params: {locale}}: {params: {locale: string}}) {
  const t = await getTranslations({locale, namespace: 'AuthLayout'});
  // No need for tLogin if LoginForm handles its own translations via useTranslations

  return (
    <AuthLayout
      title={t('loginTitle')}
      description={t('loginDescription', {appName: APP_NAME})}
      footerText={t('footerDontHaveAccount')}
      footerLinkText={t('footerSignUp')}
      footerLinkHref={`/signup`} // Link component in AuthLayout handles locale
    >
      <LoginForm />
    </AuthLayout>
  );
}
