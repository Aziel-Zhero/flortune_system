// src/app/login-admin/page.tsx
import { Suspense } from 'react';
import { AuthLayout } from "@/components/auth/auth-layout";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: `Acesso Administrativo - ${APP_NAME}`,
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
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AuthLayout
      title="Acesso Administrativo"
      description={`Use suas credenciais de administrador para acessar o workspace.`}
      footerText="Não é um administrador?"
      footerLinkText="Voltar para o login"
      footerLinkHref="/login"
    >
      <Suspense fallback={<LoginFormSkeleton />}>
        <AdminLoginForm />
      </Suspense>
    </AuthLayout>
  );
}