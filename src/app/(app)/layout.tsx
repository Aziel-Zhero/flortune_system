
"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react"; // Removido useState
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: authLoading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log(`(AppLayout) Effect triggered. AuthLoading: ${authLoading}, Session: ${session ? 'Exists' : 'Null'}, Path: ${pathname}`);

    // Não faça nada se ainda estiver carregando
    if (authLoading) {
      console.log("(AppLayout) Auth is loading. No action taken.");
      return;
    }

    // Se terminou de carregar e não há sessão, redirecione para login
    // Apenas redireciona se não estiver já em uma rota de autenticação (para evitar loop no logout)
    if (!session && pathname !== '/login' && pathname !== '/signup') {
      console.log(`(AppLayout) Auth finished loading, NO session. Redirecting to /login from ${pathname}.`);
      router.replace('/login');
    } else if (session) {
      // Se terminou de carregar e HÁ sessão, permita a renderização
      console.log(`(AppLayout) Auth finished loading, session EXISTS. User: ${session.user.id}. Allowing app render for ${pathname}.`);
    }
  }, [authLoading, session, router, pathname]);


  if (authLoading) {
    console.log("(AppLayout) Rendering SKELETON because authLoading is true.");
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Skeleton para AppHeader */}
        <div className="fixed top-0 left-0 right-0 z-40 w-full border-b bg-background/80 backdrop-blur-md h-16">
          <div className="container mx-auto flex h-full items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-4">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-24 hidden sm:block" />
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Skeleton className="h-9 w-9 rounded-full md:hidden" /> {/* Search icon on mobile */}
              <Skeleton className="h-9 w-48 hidden md:block" /> {/* Search input on desktop */}
              <Skeleton className="h-9 w-9 rounded-full" /> {/* Eye icon */}
              <Skeleton className="h-9 w-9 rounded-full" /> {/* Bell icon */}
              <Skeleton className="h-9 w-9 rounded-full" /> {/* UserNav */}
            </div>
          </div>
        </div>
        <div className="flex flex-1 pt-16">
          {/* Skeleton para AppSidebar */}
          <div className="hidden md:flex flex-col w-16 border-r bg-background p-2 space-y-2">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-md" />)}
          </div>
          {/* Skeleton para o conteúdo principal */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Skeleton className="h-12 w-1/3 mb-6" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </main>
        </div>
      </div>
    );
  }

  // Se terminou de carregar e não há sessão, o useEffect acima já deve ter iniciado o redirecionamento.
  // Renderizar null evita um flash de conteúdo.
  if (!authLoading && !session && pathname !== '/login' && pathname !== '/signup') {
    console.log("(AppLayout) Auth finished loading, NO session. Rendering NULL (redirect should be in progress).");
    return null;
  }

  // Se terminou de carregar e há sessão, ou se está numa rota pública (login/signup) enquanto não logado, renderize.
  console.log("(AppLayout) Conditions met for rendering APP LAYOUT or child component.");
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <div className="flex flex-1 pt-16">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
