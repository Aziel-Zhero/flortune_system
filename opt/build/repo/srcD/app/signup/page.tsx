
import { Suspense } from 'react';
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: `Criar uma Conta - ${APP_NAME}`,
};

function SignupFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3 mb-3" />
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full mt-4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout
      title="Criar uma Conta"
      description={`Junte-se ao ${APP_NAME} e comece a cultivar seu bem-estar financeiro.`}
      footerText="Já tem uma conta?"
      footerLinkText="Entrar"
      footerLinkHref="/login"
    >
      <Suspense fallback={<SignupFormSkeleton />}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
