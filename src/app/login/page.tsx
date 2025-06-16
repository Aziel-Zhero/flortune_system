
import { Suspense } from 'react';
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';

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
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bem-vindo de Volta!"
      description={`Faça login na sua conta ${APP_NAME} para gerenciar suas finanças.`}
      footerText="Não tem uma conta?"
      footerLinkText="Inscreva-se"
      footerLinkHref="/signup"
    >
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
