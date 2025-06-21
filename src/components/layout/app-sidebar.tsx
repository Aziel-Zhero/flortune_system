
"use client"

import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import * as LucideIcons from "lucide-react";
import { useSession } from "next-auth/react"; 
import { useAppSettings } from "@/contexts/app-settings-context";

import { cn } from "@/lib/utils";
import { NAV_LINKS_CONFIG, APP_NAME, type NavLinkItem, type NavLinkIconName } from "@/lib/constants";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Cloudy, Sun, Moon, Tornado, Wind
} from 'lucide-react';


const getIcon = (iconName?: NavLinkIconName | string): React.ElementType => {
  if (!iconName) return LucideIcons.HelpCircle;
  const IconComponent = (LucideIcons as any)[iconName as keyof typeof LucideIcons];
  return IconComponent || LucideIcons.HelpCircle;
};

const weatherIconMapping: { [key: string]: React.ElementType } = {
  "01d": Sun, "01n": Moon,
  "02d": CloudSun, "02n": Cloud,
  "03d": Cloud, "03n": Cloud,
  "04d": Cloudy, "04n": Cloudy,
  "09d": CloudRain, "09n": CloudRain,
  "10d": CloudDrizzle, "10n": CloudDrizzle,
  "11d": CloudLightning, "11n": CloudLightning,
  "13d": CloudSnow, "13n": CloudSnow,
  "50d": CloudFog, "50n": CloudFog,
  "default": Cloud,
};

const getWeatherIcon = (iconCode: string) => {
    return weatherIconMapping[iconCode] || weatherIconMapping["default"];
}


export function AppSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession(); 
  const { isMobile, setOpenMobile, open: sidebarOpen } = useSidebar();
  const { weatherData, isLoadingWeather, weatherError, weatherCity } = useAppSettings();

  const isLoadingAuth = status === "loading"; 
  const skeletonItems = Array(NAV_LINKS_CONFIG.filter(link => link.type === 'link').length).fill(0);

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

  const WeatherIcon = weatherData?.icon ? getWeatherIcon(weatherData.icon) : null;

  return (
    <Sidebar 
      variant={isMobile ? "floating" : "sidebar"}
      collapsible={isMobile ? "offcanvas" : "icon"} 
      side="left"
    >
        <SidebarHeader className="p-4 flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <Link 
              href="/dashboard" 
              className={cn(
                "flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity",
                {"group-data-[collapsible=icon]:hidden": !isMobile || (isMobile && sidebarOpen)}, 
                {"hidden": isMobile && !sidebarOpen} 
              )} 
              onClick={closeMobileSidebar}
            >
                <LucideIcons.Leaf className="h-7 w-7" />
                <span className="font-bold text-xl font-headline">{APP_NAME}</span>
            </Link>
            <Link 
                href="/dashboard" 
                className={cn(
                    "items-center space-x-2 text-primary hover:opacity-80 transition-opacity",
                    {"hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full": !isMobile},
                    {"hidden": isMobile} 
                )}
                onClick={closeMobileSidebar}
            >
                <LucideIcons.Leaf className="h-7 w-7" />
            </Link>
        </SidebarHeader>

        {!isLoadingAuth && user && (
          <div className="px-4 py-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
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
             <div className="mt-2 group-data-[collapsible=icon]:mt-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                {isLoadingWeather && weatherCity && <Skeleton className="h-5 w-24" />}
                {!isLoadingWeather && weatherData && WeatherIcon && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground group-data-[collapsible=icon]:flex-col">
                       <WeatherIcon className="h-5 w-5"/>
                       <span className="font-medium">{weatherData.temperature}°C</span>
                       <span className="hidden sm:inline group-data-[collapsible=icon]:hidden"> - {weatherData.city}</span>
                    </div>
                )}
                 {!isLoadingWeather && weatherError && weatherCity && (
                     <div className="text-xs text-destructive group-data-[collapsible=icon]:text-center">Erro</div>
                 )}
            </div>
          </div>
        )}
        {isLoadingAuth && (
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
        <Separator className="my-2 group-data-[collapsible=icon]:my-3" />

        <SidebarContent className="p-2">
          <SidebarMenu>
            {isLoadingAuth
              ? skeletonItems.map((_, index) => (
                  <SidebarMenuSkeleton key={index} showIcon />
                ))
              : NAV_LINKS_CONFIG.map((item, index) => {
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
