// src/components/layout/admin-sidebar.tsx
"use client"

import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import * as LucideIcons from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { ADMIN_NAV_LINKS_CONFIG, APP_NAME, type NavLinkItem } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarTrigger,
  SidebarHeader
} from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getIcon = (iconName?: string): React.ElementType => {
  if (!iconName) return LucideIcons.HelpCircle;
  const IconComponent = (LucideIcons as any)[iconName as keyof typeof LucideIcons];
  return IconComponent || LucideIcons.HelpCircle;
};

// Mock admin user data
const mockAdmin = {
    displayName: "Admin",
    avatarUrl: `https://placehold.co/40x40/fca5a5/1e293b?text=A`,
    avatarFallback: "A",
    accountType: "Administrador"
}

export function AdminSidebar() {
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
                  href="/dashboard-admin" 
                  className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity"
                  onClick={closeMobileSidebar}
                >
                    <Image src="/Logo.png" alt="Flortune Logo" width={28} height={28} />
                    <span className={cn("font-bold text-xl font-headline", { "group-data-[collapsible=icon]:hidden": !isMobile})}>{`${APP_NAME} WS`}</span>
                </Link>
            </div>
            <SidebarTrigger className="h-7 w-7 mt-1" />
        </SidebarHeader>
        
        <div className="px-4 py-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3 flex flex-col items-center">
          <div className="flex items-center gap-3 group p-2 rounded-md w-full -mx-2 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                <AvatarImage src={mockAdmin.avatarUrl} alt={mockAdmin.displayName} data-ai-hint="admin avatar"/>
                <AvatarFallback>{mockAdmin.avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium font-headline text-foreground">{mockAdmin.displayName}</span>
                <span className="text-xs text-muted-foreground">{mockAdmin.accountType}</span>
            </div>
          </div>
        </div>

        <Separator className="my-2 group-data-[collapsible=icon]:my-3" />

        <SidebarContent className="p-2">
          <SidebarMenu>
            {ADMIN_NAV_LINKS_CONFIG.map((item) => {
                  const IconComponent = getIcon(item.icon);
                  const isActive = pathname === item.href;
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
