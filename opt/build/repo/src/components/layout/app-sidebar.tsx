
"use client"

import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import * as LucideIcons from "lucide-react";
import { useSession } from "next-auth/react"; 

import { cn } from "@/lib/utils";
import { NAV_LINKS_CONFIG, APP_NAME, type NavLinkIconName } from "@/lib/constants";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarTrigger, 
  useSidebar,
} from "@/components/ui/sidebar"; // Importações do componente Sidebar
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const getIcon = (iconName: NavLinkIconName): React.ElementType => {
  return LucideIcons[iconName as keyof typeof LucideIcons] || LucideIcons.HelpCircle;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession(); 
  const { isMobile, setOpenMobile, open: sidebarOpen } = useSidebar(); // Adicionado sidebarOpen

  const isLoading = status === "loading"; 
  const skeletonItems = Array(NAV_LINKS_CONFIG.length).fill(0);

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  const user = session?.user;
  const userProfile = user?.profile; 

  const displayName = userProfile?.display_name || user?.name || "Usuário";
  const avatarUrl = userProfile?.avatar_url || user?.image || `https://placehold.co/40x40.png?text=${displayName.charAt(0).toUpperCase()}`;
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <Sidebar 
      variant={isMobile ? "floating" : "sidebar"} // Ajuste para mobile
      collapsible={isMobile ? "offcanvas" : "icon"} 
      side="left"
    >
        <SidebarHeader className="p-4 flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            {/* Logo e Nome do App - Visível quando expandido */}
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity group-data-[collapsible=icon]:hidden" 
              onClick={closeMobileSidebar}
            >
                <LucideIcons.Leaf className="h-7 w-7" />
                <span className="font-bold text-xl font-headline">{APP_NAME}</span>
            </Link>

            {/* Botão de Toggle Sidebar - Visível quando expandido e não mobile */}
            {!isMobile && (
                <div className={cn("group-data-[collapsible=icon]:hidden")}>
                    <SidebarTrigger />
                </div>
            )}
            
            {/* Logo - Visível quando colapsado (desktop) ou no modo mobile (se o nome não couber) */}
            <Link 
                href="/dashboard" 
                className={cn(
                    "items-center space-x-2 text-primary hover:opacity-80 transition-opacity",
                    {"hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full": !isMobile},
                    {"flex md:hidden": isMobile && !sidebarOpen} // Mostrar logo no mobile quando colapsado
                )}
                onClick={closeMobileSidebar}
            >
                <LucideIcons.Leaf className="h-7 w-7" />
            </Link>
        </SidebarHeader>

        {/* Informações do Usuário */}
        {!isLoading && user && (
          <div className="px-4 py-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <Link href="/settings" className="flex items-center gap-3 group hover:bg-muted/50 p-2 rounded-md -mx-2 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center" onClick={closeMobileSidebar}>
              <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar"/>
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium font-headline text-foreground group-hover:text-primary">{displayName}</span>
                  <span className="text-xs text-muted-foreground">Conta Pessoal</span>
              </div>
            </Link>
          </div>
        )}
        {isLoading && (
           <div className="px-4 py-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-3 p-2 -mx-2 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
              <Skeleton className="h-9 w-9 rounded-full group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
              <div className="space-y-1 group-data-[collapsible=icon]:hidden">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        )}
        <Separator className="my-2 group-data-[collapsible=icon]:hidden" />

        <SidebarContent className="p-2">
          <SidebarMenu>
            {isLoading
              ? skeletonItems.map((_, index) => (
                  <SidebarMenuSkeleton key={index} showIcon />
                ))
              : NAV_LINKS_CONFIG.map((link) => {
                  const IconComponent = getIcon(link.icon as NavLinkIconName);
                  const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={isMobile ? undefined : { children: link.label }} // Tooltip apenas em desktop
                        className="justify-start"
                        onClick={closeMobileSidebar}
                      >
                        <Link href={link.href}>
                          <IconComponent />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
          </SidebarMenu>
        </SidebarContent>
        {/* O SidebarFooter foi removido */}
    </Sidebar>
  );
}

    