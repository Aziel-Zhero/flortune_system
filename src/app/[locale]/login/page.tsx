import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";
import {getTranslations} from 'next-intl/server';

export default async function LoginPage({params: {locale}}: {params: {locale: string}}) {
  const t = await getTranslations({locale, namespace: 'AuthLayout'});
  const tLogin = await getTranslations({locale, namespace: 'LoginForm'}); // For any direct text if needed

  return (
    <AuthLayout
      title={t('loginTitle')}
      description={t('loginDescription', {appName: APP_NAME})}
      footerText={t('footerDontHaveAccount')}
      footerLinkText={t('footerSignUp')}
      footerLinkHref={`/${locale}/signup`}
      locale={locale}
    >
      <LoginForm />
    </AuthLayout>
  );
}
