// src/app/(app)/layout.tsx

"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

// A verificação de sessão foi removida para permitir acesso sem autenticação.
// O layout agora renderiza diretamente os componentes filhos.

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
