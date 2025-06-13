
"use client"

import Link from "next-intl/link"; // Use next-intl's Link for locale-aware navigation
import { usePathname } from "next-intl/navigation"; // Updated import
import * as LucideIcons from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { NAV_LINKS_KEYS, APP_NAME, type NavLinkIcon } from "@/lib/constants";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


// Helper to get Lucide icon component by name
const getIcon = (iconName: NavLinkIcon): React.ElementType => {
  return LucideIcons[iconName as keyof typeof LucideIcons] || LucideIcons.HelpCircle;
};

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('Navigation');
  const tUserNav = useTranslations('UserNav');


  // Placeholder for loading state
  const isLoading = false; // Set to true to see skeleton
  const skeletonItems = Array(5).fill(0);

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <Link href="/dashboard" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity group-data-[collapsible=icon]:hidden">
                <LucideIcons.Leaf className="h-7 w-7" />
                <span className="font-bold text-xl font-headline">{APP_NAME}</span>
            </Link>
            <div className="group-data-[collapsible=icon]:hidden ml-auto">
                 <SidebarTrigger />
            </div>
            <Link href="/dashboard" className="hidden items-center space-x-2 text-primary hover:opacity-80 transition-opacity group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
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
                  const IconComponent = getIcon(link.icon)
                  // Check if the current pathname (without locale) starts with the link's href
                  // For exact match (like /dashboard), pathname should be equal to link.href
                  // For nested routes (like /settings/*), pathname should start with link.href
                  const isActive = link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);

                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={{ children: t(link.labelKey as any) }}
                        className="justify-start"
                      >
                        <Link href={link.href}>
                          <IconComponent />
                          <span>{t(link.labelKey as any)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
          </SidebarMenu>
        </SidebarContent>
        <Separator className="mt-auto group-data-[collapsible=icon]:hidden" />
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="Flora Green" data-ai-hint="woman nature"/>
                    <AvatarFallback>FG</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-medium font-headline">Flora Green</span>
                    <span className="text-xs text-muted-foreground">{tUserNav('personalAccount')}</span>
                </div>
                 <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                    <LucideIcons.ChevronsUpDown className="h-4 w-4"/>
                 </Button>
            </div>
        </SidebarFooter>
         <SidebarFooter className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/100x100.png" alt="Flora Green" data-ai-hint="woman nature"/>
                <AvatarFallback>FG</AvatarFallback>
            </Avatar>
        </SidebarFooter>
    </Sidebar>
  )
}

    