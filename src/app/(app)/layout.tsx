
"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useSession, signOut } from "next-auth/react"; // Importa useSession do NextAuth
import { useEffect } from "react"; 
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession(); // Usa o hook useSession
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = status === "loading";

  useEffect(() => {
    // console.log(`(AppLayout - NextAuth) Effect triggered. Status: ${status}, Session: ${session ? 'Exists' : 'Null'}, Path: ${pathname}`);

    if (isLoading) {
      // console.log("(AppLayout - NextAuth) Auth is loading. No redirection action taken.");
      return;
    }

    if (!session && pathname !== '/login' && pathname !== '/signup') {
      // console.log(`(AppLayout - NextAuth) Auth finished loading, NO session. Redirecting to /login from ${pathname}.`);
      router.replace('/login'); // Poderia adicionar callbackUrl aqui se quisesse: `/login?callbackUrl=${pathname}`
    } else if (session) {
      // console.log(`(AppLayout - NextAuth) Auth finished loading, session EXISTS. User: ${session.user?.id}. Allowing app render for ${pathname}.`);
    }
  }, [isLoading, session, router, pathname]);

  if (isLoading) {
    // console.log("(AppLayout - NextAuth) Rendering SKELETON because auth status is 'loading'.");
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="fixed top-0 left-0 right-0 z-40 w-full border-b bg-background/80 backdrop-blur-md h-16">
          <div className="container mx-auto flex h-full items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-4">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-24 hidden sm:block" />
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Skeleton className="h-9 w-9 rounded-full md:hidden" />
              <Skeleton className="h-9 w-48 hidden md:block" />
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Skeleton className="h-12 w-1/3 mb-6" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </main>
        </div>
      </div>
    );
  }

  if (!session && pathname !== '/login' && pathname !== '/signup') {
    // console.log("(AppLayout - NextAuth) Auth finished loading, NO session. Rendering NULL (redirect should be in progress).");
    return null;
  }

  // console.log("(AppLayout - NextAuth) Conditions met for rendering APP LAYOUT or child component.");
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
