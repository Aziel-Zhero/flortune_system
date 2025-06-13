import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { APP_NAME } from "@/lib/constants";
import {getTranslations} from 'next-intl/server';

export default async function SignupPage({params: {locale}}: {params: {locale: string}}) {
  const t = await getTranslations({locale, namespace: 'AuthLayout'});

  return (
    <AuthLayout
      title={t('signupTitle')}
      description={t('signupDescription', {appName: APP_NAME})}
      footerText={t('footerAlreadyHaveAccount')}
      footerLinkText={t('footerSignIn')}
      footerLinkHref={`/${locale}/login`}
      locale={locale}
    >
      <SignupForm />
    </AuthLayout>
  );
}
