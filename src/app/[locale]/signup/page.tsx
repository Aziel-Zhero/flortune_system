import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { APP_NAME } from "@/lib/constants";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'AuthLayout'});
  return {
    title: `${t('signupTitle')} - ${APP_NAME}`,
  };
}

export default async function SignupPage({params: {locale}}: {params: {locale: string}}) {
  const t = await getTranslations({locale, namespace: 'AuthLayout'});

  return (
    <AuthLayout
      title={t('signupTitle')}
      description={t('signupDescription', {appName: APP_NAME})}
      footerText={t('footerAlreadyHaveAccount')}
      footerLinkText={t('footerSignIn')}
      footerLinkHref={`/login`} // Link component in AuthLayout handles locale
    >
      <SignupForm />
    </AuthLayout>
  );
}
