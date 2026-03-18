
// src/app/(admin)/layout.tsx
"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { useSession } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    
    if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
      router.replace('/login');
    }
  }, [isLoading, session, router, pathname]);

  if (isLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <div className="fixed top-0 left-0 right-0 z-40 w-full border-b bg-background/80 backdrop-blur-md h-16">
                <div className="container mx-auto flex h-full items-center justify-between px-4 md:px-6 max-w-[1850px]">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Skeleton className="h-7 w-7" />
                        <Skeleton className="h-7 w-24" />
                    </div>
                </div>
            </div>
            <div className="flex flex-1 pt-16 h-full">
                <div className="hidden md:flex flex-col w-16 border-r bg-background p-2 space-y-2">
                    {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-md" />)}
                </div>
                <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col overflow-y-auto min-w-0">
                    <Skeleton className="h-12 w-1/3 mb-6" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                </main>
            </div>
        </div>
    );
  }

  if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
      return null;
  }
  
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <AppHeader />
        <div className="flex flex-1 pt-16 h-full">
          <AdminSidebar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col overflow-y-auto min-w-0">
            <div className="max-w-[1850px] mx-auto w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
