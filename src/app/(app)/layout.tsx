// src/app/(app)/layout.tsx
"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useSession } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    
    // Apenas garante que o usuário esteja logado para acessar as rotas do app.
    // O redirecionamento específico pós-login agora é tratado na server action.
    if (!session && pathname !== '/login' && pathname !== '/signup') {
      router.replace('/login');
    }

  }, [isLoading, session, router, pathname]);

  if (isLoading || (!session && pathname !== '/login' && pathname !== '/signup')) {
    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col bg-background overflow-hidden"> 
                <div className="fixed top-0 left-0 right-0 z-40 w-full border-b bg-background/80 backdrop-blur-md h-16">
                <div className="container mx-auto flex h-full items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2 md:gap-4">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-7 w-24 hidden sm:block" />
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                </div>
                </div>
                <div className="flex flex-1 pt-16">
                <div className="hidden md:flex flex-col w-16 border-r bg-background p-2 space-y-2">
                    {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-md" />)}
                </div>
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0">
                    <Skeleton className="h-12 w-1/3 mb-6" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                </main>
                </div>
            </div>
        );
    }
    return null; 
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col bg-background overflow-hidden">
        <AppHeader />
        <div className="flex flex-1 pt-16"> 
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
