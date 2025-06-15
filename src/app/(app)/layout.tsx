
"use client"; // (app) layout pode ser client component se precisar de hooks

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Usar next/navigation
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Este useEffect é mais para garantir que, se o estado de autenticação mudar
    // e o middleware não pegar por algum motivo (ex: navegação no lado do cliente
    // que não aciona o middleware), nós ainda redirecionamos.
    // O middleware deve ser a primeira linha de defesa.
    if (!isLoading && !session) {
      router.replace('/login'); // Usar replace para não adicionar ao histórico
    }
  }, [isLoading, session, router]);

  if (isLoading) {
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
  
  // Só renderiza o layout do aplicativo se houver uma sessão (após o carregamento)
  // O middleware já deve ter redirecionado se não houver sessão,
  // mas esta é uma verificação adicional.
  if (!session) { 
    // Este return null é para o caso de o useEffect de redirecionamento ainda não ter rodado,
    // ou para evitar flash de conteúdo não autenticado.
    // O ideal é que o middleware já tenha feito o redirect.
    return null; 
  }


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
