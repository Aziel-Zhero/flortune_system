
"use client"; 

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react"; // useState added
import { useRouter, usePathname } from "next/navigation"; 
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: authLoading, session } = useAuth(); // Renamed to authLoading for clarity
  const router = useRouter();
  const pathname = usePathname();
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  useEffect(() => {
    console.log(`(AppLayout) Auth state updated: authLoading=${authLoading}, session=${session ? 'Exists' : 'Null'}, initialAuthCheckComplete=${initialAuthCheckComplete}, Path: ${pathname}`);
    
    // This block ensures initialAuthCheckComplete is set to true ONCE authLoading becomes false.
    if (!authLoading && !initialAuthCheckComplete) {
      console.log("(AppLayout) AuthContext has finished loading (authLoading is false). Marking initial auth check as complete.");
      setInitialAuthCheckComplete(true);
    }

    // Only attempt to redirect IF the initial auth check is complete.
    if (initialAuthCheckComplete) {
      if (!session) {
        console.log(`(AppLayout) Initial auth check complete AND no session. Redirecting to /login from ${pathname}.`);
        router.replace('/login');
      } else {
        console.log(`(AppLayout) Initial auth check complete AND session exists. User: ${session.user.id}. Allowing app render for ${pathname}.`);
        // Session exists, allow rendering of children (handled by the return statement below).
      }
    } else {
      console.log("(AppLayout) Waiting for initial auth check to complete (authLoading is true or initialAuthCheckComplete is false).");
    }
  }, [authLoading, session, router, pathname, initialAuthCheckComplete]);


  // Show skeleton if EITHER the initial auth check isn't marked complete OR authContext is still loading.
  // This ensures we show a skeleton until we are certain about the auth state.
  if (!initialAuthCheckComplete || authLoading) {
    console.log(`(AppLayout) Rendering SKELETON because initialAuthCheckComplete=${initialAuthCheckComplete} OR authLoading=${authLoading}.`);
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
  
  // If initial check is complete but there's no session,
  // the useEffect above should have initiated a redirect.
  // Returning null here prevents a flash of content before redirect completes.
  if (initialAuthCheckComplete && !session) { 
    console.log("(AppLayout) Initial auth check complete, but NO session. Rendering NULL (redirect to /login should be in progress).");
    return null; 
  }

  // If initial check is complete AND a session exists, render the app.
  console.log("(AppLayout) Initial auth check complete and session IS present. Rendering APP LAYOUT.");
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
