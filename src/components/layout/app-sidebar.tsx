// src/components/layout/app-sidebar.tsx
"use client"

import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import * as LucideIcons from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { NAV_LINKS_CONFIG, APP_NAME, type NavLinkItem, type NavLinkIconName, PRICING_TIERS, type PricingTierIconName } from "@/lib/constants";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useAppSettings } from "@/contexts/app-settings-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../ui/button";
import { useSession } from "@/contexts/auth-context";

const getIcon = (iconName?: NavLinkIconName | string): React.ElementType => {
  if (!iconName) return LucideIcons.HelpCircle;
  const IconComponent = (LucideIcons as any)[iconName as keyof typeof LucideIcons];
  return IconComponent || LucideIcons.HelpCircle;
};

const getPricingIcon = (iconName?: PricingTierIconName): React.ElementType => {
  if (!iconName) return LucideIcons.Gem;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Gem;
};


function WeatherDisplay() {
    const { weatherData, isLoadingWeather, weatherCity } = useAppSettings();

    if (isLoadingWeather) {
        return (
            <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2 w-12" />
                </div>
            </div>
        );
    }

    if (!weatherCity || !weatherData) {
        return null;
    }
    
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center gap-2 mt-2 group-data-[collapsible=icon]:hidden">
                    <Image src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} alt={weatherData.description} width={24} height={24}/>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold">{weatherData.temperature}°C</span>
                        <span className="text-[10px] text-muted-foreground capitalize -mt-0.5">{weatherData.city}</span>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{weatherData.city}: {weatherData.temperature}°C, {weatherData.description}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { session } = useSession();
  const user = session?.user;
  const profile = user?.profile;
  const { isMobile, setOpenMobile } = useSidebar();

  const displayName = profile?.display_name || user?.email?.split('@')[0] || "Usuário";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const avatarFallback = displayName?.charAt(0).toUpperCase() || "U";
  
  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const userPlanId = profile?.plan_id || 'tier-cultivador';
  const userPlan = PRICING_TIERS.find(p => p.id === userPlanId);

  const PlanIcon = getPricingIcon(userPlan?.icon as PricingTierIconName);
  
  const planIconColorClasses: Record<string, string> = {
    'tier-cultivador': 'text-green-400 drop-shadow-[0_0_3px_#34d399]',
    'tier-mestre': 'text-yellow-400 drop-shadow-[0_0_3px_#facc15]',
    'tier-dev': 'text-sky-400 drop-shadow-[0_0_3px_#38bdf8]',
    'tier-corporativo': 'text-amber-600 drop-shadow-[0_0_3px_#d97706]',
  };

  const filteredNavLinks = NAV_LINKS_CONFIG.filter(item => {
    if (item.type !== 'link') return true;
    const isDevRoute = item.href.startsWith('/dev');
    const isCorpRoute = item.href.startsWith('/corporate');
    
    if (isDevRoute && userPlanId !== 'tier-dev' && userPlanId !== 'tier-corporativo' && profile?.role !== 'admin') {
      return false;
    }
    if (isCorpRoute && userPlanId !== 'tier-corporativo' && profile?.role !== 'admin') {
      return false;
    }
    return true;
  });

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
                    <Image src="/Logo.png" alt="Flortune Logo" width={28} height={28} className="h-7 w-auto" />
                    <span className={cn("font-bold text-xl font-headline", { "group-data-[collapsible=icon]:hidden": !isMobile})}>{APP_NAME}</span>
                </Link>
            </div>
        </SidebarHeader>
        
        <div className="px-4 py-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3 flex flex-col items-center">
          <Link href="/profile" className="flex items-center gap-3 group hover:bg-muted/50 p-2 rounded-md w-full -mx-2 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center" onClick={closeMobileSidebar}>
            <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar"/>}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium font-headline text-foreground group-hover:text-primary">{displayName}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {PlanIcon && <PlanIcon className={cn("h-3 w-3", planIconColorClasses[userPlanId] || 'text-muted-foreground')} />}
                  {userPlan?.name || 'Plano Básico'}
                </span>
                <WeatherDisplay />
            </div>
          </Link>
        </div>
        
        <div className="px-3 mt-2 flex justify-end group-data-[collapsible=icon]:justify-center">
           <SidebarTrigger />
        </div>
        
        <Separator className="my-2 group-data-[collapsible=icon]:my-3" />

        <SidebarContent className="p-2">
          <SidebarMenu>
            {filteredNavLinks.map((item, index) => {
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
