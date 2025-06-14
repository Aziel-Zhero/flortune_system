
"use client"

import { Link, usePathname } from "next-intl/client"; // Corrected for client components
import * as LucideIcons from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { NAV_LINKS_KEYS, APP_NAME, type NavLinkIconName, DEFAULT_USER } from "@/lib/constants";
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
  useSidebar, // Import useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getIcon = (iconName: NavLinkIconName): React.ElementType => {
  return LucideIcons[iconName as keyof typeof LucideIcons] || LucideIcons.HelpCircle;
};

export function AppSidebar() {
  const pathname = usePathname(); // This will be the path without locale
  const tNav = useTranslations('Navigation');
  const tUser = useTranslations('UserNav');
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar(); // Get sidebar state

  const isLoading = false; // Placeholder for actual loading state
  const skeletonItems = Array(5).fill(0);

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible={isMobile ? "offcanvas" : "icon"} side="left">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <Link href="/dashboard" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity group-data-[collapsible=icon]:hidden" onClick={closeMobileSidebar}>
                <LucideIcons.Leaf className="h-7 w-7" />
                <span className="font-bold text-xl font-headline">{APP_NAME}</span>
            </Link>
            {/* Trigger is now in AppHeader for md:hidden, and here for larger screens when not icon-only */}
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
              : NAV_LINKS_KEYS.map((link) => {
                  const IconComponent = getIcon(link.icon);
                  const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={{ children: tNav(link.labelKey as any) }}
                        className="justify-start"
                        onClick={closeMobileSidebar}
                      >
                        <Link href={link.href}>
                          <IconComponent />
                          <span>{tNav(link.labelKey as any)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
          </SidebarMenu>
        </SidebarContent>
        <Separator className="mt-auto group-data-[collapsible=icon]:hidden" />
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={DEFAULT_USER.avatarUrl} alt={DEFAULT_USER.name} data-ai-hint="woman nature"/>
                    <AvatarFallback>{DEFAULT_USER.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-medium font-headline">{DEFAULT_USER.name}</span>
                    <span className="text-xs text-muted-foreground">{tUser('personalAccount')}</span>
                </div>
                 <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                    <LucideIcons.ChevronsUpDown className="h-4 w-4"/>
                 </Button>
            </div>
        </SidebarFooter>
         <SidebarFooter className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8">
                <AvatarImage src={DEFAULT_USER.avatarUrl} alt={DEFAULT_USER.name} data-ai-hint="woman nature"/>
                <AvatarFallback>{DEFAULT_USER.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
        </SidebarFooter>
    </Sidebar>
  );
}
