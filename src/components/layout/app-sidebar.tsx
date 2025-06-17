
"use client"

import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import * as LucideIcons from "lucide-react";
import { useSession } from "next-auth/react"; // Importa useSession do NextAuth

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
} from "@/components/ui/sidebar";
// import { Button } from "@/components/ui/button"; // Não usado diretamente aqui
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
// useAuth (antigo) não é mais necessário

const getIcon = (iconName: NavLinkIconName): React.ElementType => {
  return LucideIcons[iconName as keyof typeof LucideIcons] || LucideIcons.HelpCircle;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession(); // Usa o hook useSession
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();

  const isLoading = status === "loading"; // Usa o status do useSession
  const skeletonItems = Array(5).fill(0);

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  const user = session?.user;
  const userProfile = user?.profile; // Perfil aninhado na sessão

  const displayName = userProfile?.display_name || user?.name || "Usuário";
  const avatarUrl = userProfile?.avatar_url || user?.image || `https://placehold.co/100x100.png?text=${displayName.charAt(0).toUpperCase()}`;
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <Sidebar variant="sidebar" collapsible={isMobile ? "offcanvas" : "icon"} side="left">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <Link href="/dashboard" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity group-data-[collapsible=icon]:hidden" onClick={closeMobileSidebar}>
                <LucideIcons.Leaf className="h-7 w-7" />
                <span className="font-bold text-xl font-headline">{APP_NAME}</span>
            </Link>
            <div className={cn("ml-auto", {"group-data-[collapsible=icon]:hidden": !isMobile, "hidden": isMobile })}>
                 <SidebarTrigger />
            </div>
            <Link href="/dashboard" className="hidden items-center space-x-2 text-primary hover:opacity-80 transition-opacity group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full" onClick={closeMobileSidebar}>
                <LucideIcons.Leaf className="h-7 w-7" />
            </Link>
          </div>
        </SidebarHeader>
        <Separator className="mb-2 group-data-[collapsible=icon]:hidden" />
        <SidebarContent className="p-2">
          <SidebarMenu>
            {isLoading
              ? skeletonItems.map((_, index) => (
                  <SidebarMenuSkeleton key={index} showIcon />
                ))
              : NAV_LINKS_CONFIG.map((link) => {
                  const IconComponent = getIcon(link.icon);
                  const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={{ children: link.label }}
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
        <Separator className="mt-auto group-data-[collapsible=icon]:hidden" />
        {!isLoading && user && (
          <>
            <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar"/>
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium font-headline">{displayName}</span>
                        <span className="text-xs text-muted-foreground">Conta Pessoal</span>
                    </div>
                </div>
            </SidebarFooter>
            <SidebarFooter className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar"/>
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
            </SidebarFooter>
          </>
        )}
         {isLoading && (
          <>
            <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </SidebarFooter>
            <SidebarFooter className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
              <Skeleton className="h-8 w-8 rounded-full" />
            </SidebarFooter>
          </>
        )}
    </Sidebar>
  );
}
