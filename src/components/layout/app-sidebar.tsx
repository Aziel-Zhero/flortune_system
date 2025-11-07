// src/components/layout/app-sidebar.tsx
"use client"

import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import * as LucideIcons from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { NAV_LINKS_CONFIG, APP_NAME, type NavLinkItem, type NavLinkIconName } from "@/lib/constants";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";


const getIcon = (iconName?: NavLinkIconName | string): React.ElementType => {
  if (!iconName) return LucideIcons.HelpCircle;
  const IconComponent = (LucideIcons as any)[iconName as keyof typeof LucideIcons];
  return IconComponent || LucideIcons.HelpCircle;
};

// Mock user data since authentication is disabled
const mockUser = {
    displayName: "Usuário",
    avatarUrl: `https://placehold.co/40x40.png?text=U`,
    avatarFallback: "U",
}

// Simulação de quais seções têm conteúdo compartilhado
const sharedSections: string[] = ['budgets', 'transactions', 'todos'];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  
  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar 
      variant={isMobile ? "floating" : "sidebar"}
      collapsible={isMobile ? "offcanvas" : "icon"} 
      side="left"
    >
        <SidebarHeader className="p-4 flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2 flex-grow">
                <Link 
                  href="/dashboard" 
                  className={cn(
                    "flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity",
                  )} 
                  onClick={closeMobileSidebar}
                >
                    <Image src="/Logo.png" alt="Flortune Logo" width={28} height={28} />
                    <span className={cn("font-bold text-xl font-headline", { "group-data-[collapsible=icon]:hidden": !isMobile})}>{APP_NAME}</span>
                </Link>
            </div>
        </SidebarHeader>
        
        <div className="px-4 py-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3 flex flex-col items-center">
          <Link href="/profile" className="flex items-center gap-3 group hover:bg-muted/50 p-2 rounded-md w-full -mx-2 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center" onClick={closeMobileSidebar}>
            <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                <AvatarImage src={mockUser.avatarUrl} alt={mockUser.displayName} data-ai-hint="user avatar"/>
                <AvatarFallback>{mockUser.avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium font-headline text-foreground group-hover:text-primary">{mockUser.displayName}</span>
                <span className="text-xs text-muted-foreground">Conta Local</span>
            </div>
          </Link>
        </div>

        <div className="px-3 mt-2 flex justify-end group-data-[collapsible=icon]:justify-center">
           <SidebarTrigger />
        </div>


        <Separator className="my-2 group-data-[collapsible=icon]:my-3" />

        <SidebarContent className="p-2">
          <SidebarMenu>
            {NAV_LINKS_CONFIG.map((item, index) => {
                  if (item.type === "separator") {
                    return <Separator key={`sep-${index}`} className="my-2 mx-2 group-data-[collapsible=icon]:hidden" />;
                  }
                  if (item.type === "title") {
                    return (
                      <div 
                        key={`title-${index}`} 
                        className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider group-data-[collapsible=icon]:hidden"
                      >
                        {item.label}
                      </div>
                    );
                  }
                  const IconComponent = getIcon(item.icon);
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const sectionKey = item.href.split('/').pop();
                  const isShared = sectionKey && sharedSections.includes(sectionKey);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={isMobile ? undefined : { children: item.label }} 
                        className="justify-start"
                        onClick={closeMobileSidebar}
                      >
                        <Link href={item.href}>
                          <IconComponent />
                          <span>{item.label}</span>
                           {isShared && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <LucideIcons.Share2 className="ml-auto h-3 w-3 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent side="right"><p>Contém itens compartilhados</p></TooltipContent>
                            </Tooltip>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
          </SidebarMenu>
        </SidebarContent>
    </Sidebar>
  );
}
