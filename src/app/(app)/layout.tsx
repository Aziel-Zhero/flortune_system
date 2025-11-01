
"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <AppHeader />
        <div className="flex h-full">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto pl-[var(--sidebar-width)] pt-16 group-data-[state=collapsed]:pl-[var(--sidebar-width-icon)] md:transition-[padding-left] md:ease-linear">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
