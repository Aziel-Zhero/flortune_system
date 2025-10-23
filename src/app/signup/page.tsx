
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Criar uma Conta - ${APP_NAME}`,
};

export default function SignupPage() {
  return (
    <AuthLayout
      title="Criar uma Conta"
      description={`Junte-se ao ${APP_NAME} e comece a cultivar seu bem-estar financeiro.`}
      footerText="Já tem uma conta?"
      footerLinkText="Entrar"
      footerLinkHref="/login" // Rota direta, sem locale
    >
      <SignupForm />
    </AuthLayout>
  );
}
