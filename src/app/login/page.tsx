// src/app/login/page.tsx
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from 'next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailCheck, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: `Bem-vindo de Volta! - ${APP_NAME}`,
};

function LoginAlerts({ signupSuccess, isConfirmed }: { signupSuccess?: boolean, isConfirmed?: boolean }) {
    if (isConfirmed) {
        return (
            <Alert
              variant="default"
              className="mb-4 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700"
            >
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-700 dark:text-emerald-300">
                Cadastro Realizado com Sucesso!
              </AlertTitle>
              <AlertDescription className="text-emerald-600 dark:text-emerald-400">
                Sua conta foi criada. Você já pode fazer o login.
              </AlertDescription>
            </Alert>
        );
    }
    if (signupSuccess) {
        return (
            <Alert
              variant="default"
              className="mb-4 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700"
            >
              <MailCheck className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-700 dark:text-emerald-300">
                Confirme seu E-mail
              </AlertTitle>
              <AlertDescription className="text-emerald-600 dark:text-emerald-400">
                Cadastro realizado com sucesso! Enviamos um link de confirmação para seu
                e-mail. Por favor, verifique sua caixa de entrada.
              </AlertDescription>
            </Alert>
        );
    }
    return null;
}

// O componente da página agora é 'async' para poder usar 'await'
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Acessando os searchParams diretamente e de forma segura.
  const signupParam = searchParams?.signup;
  const message = searchParams?.message as string | undefined;
  
  const signupSuccess = signupParam === 'success';
  const isConfirmed = signupParam === 'success_direct';

  return (
    <AuthLayout
      title="Bem-vindo de Volta!"
      description={`Faça login na sua conta ${APP_NAME} para gerenciar suas finanças.`}
      footerText="Não tem uma conta?"
      footerLinkText="Inscreva-se"
      footerLinkHref="/signup"
    >
      <LoginAlerts signupSuccess={signupSuccess} isConfirmed={isConfirmed} />
      <LoginForm message={message} />
    </AuthLayout>
  );
}