
"use client"; 

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs when isLoading or session changes.
    // It decides whether to redirect or allow rendering.
    if (isLoading) {
      console.log(`(AppLayout) AuthContext is loading. Current path: ${pathname}. Waiting...`);
      // While AuthContext is loading, we don't redirect. Skeleton will be shown.
      return;
    }

    // At this point, AuthContext has finished loading (isLoading is false).
    if (!session) {
      console.log(`(AppLayout) AuthContext loaded, NO session found. Current path: ${pathname}. Redirecting to /login.`);
      router.replace('/login');
    } else {
      console.log(`(AppLayout) AuthContext loaded, session IS present. User: ${session.user.id}. Current path: ${pathname}. Allowing app render.`);
      // Session is present, allow rendering of children.
    }
  }, [isLoading, session, router, pathname]);


  if (isLoading) {
    // Show skeleton ONLY while AuthContext is actively loading the initial session.
    console.log("(AppLayout) Rendering SKELETON because AuthContext isLoading is true.");
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
  
  // If isLoading is false, but there's no session,
  // the useEffect above should have initiated a redirect.
  // Returning null here prevents a flash of the (app) layout content
  // before the redirect to /login completes.
  if (!session) { 
    console.log("(AppLayout) isLoading is false, but NO session. Rendering NULL (redirect to /login should be in progress).");
    return null; 
  }

  // If isLoading is false AND a session exists, render the app.
  console.log("(AppLayout) isLoading is false and session IS present. Rendering APP LAYOUT.");
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
