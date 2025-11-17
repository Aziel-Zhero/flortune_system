// src/app/login/page.tsx
import { Suspense } from 'react';
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailCheck, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: `Bem-vindo de Volta! - ${APP_NAME}`,
};

function LoginFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// O componente da página agora recebe `searchParams` como prop
export default async function LoginPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Acessa os parâmetros diretamente, pois já estão resolvidos pelo Next.js
  const signupParam = searchParams?.signup;
  const errorParam = searchParams?.error;

  return (
    <AuthLayout
      title="Bem-vindo de Volta!"
      description={`Faça login na sua conta ${APP_NAME} para gerenciar suas finanças.`}
      footerText="Não tem uma conta?"
      footerLinkText="Inscreva-se"
      footerLinkHref="/signup"
    >
      {signupParam === 'success' && (
        <Alert variant="default" className="mb-4 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700">
          <MailCheck className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-700 dark:text-emerald-300">Confirme seu E-mail</AlertTitle>
          <AlertDescription className="text-emerald-600 dark:text-emerald-400">
            Cadastro realizado com sucesso! Enviamos um link de confirmação para seu e-mail. Por favor, verifique sua caixa de entrada.
          </AlertDescription>
        </Alert>
      )}
       {signupParam === 'success_direct' && (
        <Alert variant="default" className="mb-4 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-700 dark:text-emerald-300">Cadastro Realizado com Sucesso!</AlertTitle>
          <AlertDescription className="text-emerald-600 dark:text-emerald-400">
            Sua conta foi criada. Você já pode fazer o login.
          </AlertDescription>
        </Alert>
      )}
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm error={errorParam as string | undefined} />
      </Suspense>
    </AuthLayout>
  );
}
