
"use client"; // (app) layout pode ser client component se precisar de hooks

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // Usar next/navigation
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  useEffect(() => {
    // Se o carregamento inicial do AuthContext ainda não terminou, não fazemos nada ainda.
    if (isLoading) {
      setInitialAuthCheckComplete(false); // Garante que a verificação é refeita se isLoading mudar
      return;
    }

    // Se o carregamento terminou, marcamos que a verificação inicial foi completa.
    setInitialAuthCheckComplete(true);

    // Se a verificação inicial está completa E não há sessão, redireciona para o login.
    if (!session) {
      console.log(`(AppLayout) Auth check complete, no session. Current path: ${pathname}. Redirecting to /login.`);
      router.replace('/login');
    } else {
      console.log(`(AppLayout) Auth check complete, session found. User: ${session.user.id}. Current path: ${pathname}.`);
    }
  }, [isLoading, session, router, pathname]);


  if (isLoading || !initialAuthCheckComplete) {
    // Mostra skeleton enquanto o AuthContext está carregando OU
    // se a primeira verificação após isLoading=false ainda não determinou o estado da sessão.
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
  
  // Se chegou aqui, initialAuthCheckComplete é true.
  // Se não há sessão neste ponto (e o useEffect acima já rodou e tentou redirecionar),
  // este return null previne um flash de conteúdo antes do redirecionamento efetivo.
  if (!session) { 
    console.log("(AppLayout) No session after initial check, rendering null (redirect should occur).");
    return null; 
  }

  // Se há sessão e a verificação inicial está completa, renderiza o layout do app.
  console.log("(AppLayout) Session present and auth check complete, rendering app.");
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
