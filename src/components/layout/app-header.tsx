// src/components/layout/app-header.tsx

"use client";

import Link from "next/link";
import { Eye, EyeOff, Search, Bell, Menu, BellRing, Circle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "./user-nav";
import { useAppSettings } from '@/contexts/app-settings-context';
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const iconColorClasses = {
  primary: "text-primary",
  destructive: "text-destructive",
  amber: "text-accent",
  blue: "text-blue-500",
};

export function AppHeader() {
  const { 
    isPrivateMode, 
    togglePrivateMode, 
    notifications,
    hasUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useAppSettings();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  
  const isAdminArea = pathname.startsWith('/dashboard-admin') || pathname.startsWith('/admin');
  const appTitle = isAdminArea ? `${APP_NAME} Workspace` : APP_NAME;
  const logoLink = isAdminArea ? "/dashboard-admin" : "/dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
           <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)} className="md:hidden -ml-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <Link href={logoLink} className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
            <Image src="/Logo.png" alt="Flortune Logo" width={28} height={28} style={{ height: 'auto' }} />
            <span className="font-bold text-xl font-headline hidden sm:inline-block">{appTitle}</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          {!isAdminArea && (
            <>
              <form className="hidden md:flex flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar transações, orçamentos..."
                    className="pl-10 h-9"
                  />
                </div>
              </form>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePrivateMode}
                aria-label={isPrivateMode ? "Desabilitar modo privado" : "Habilitar modo privado"}
                className="h-9 w-9"
              >
                {isPrivateMode ? <EyeOff className="h-5 w-5 text-accent" /> : <Eye className="h-5 w-5" />}
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 relative"
              >
                <Bell className="h-5 w-5" />
                {hasUnreadNotifications && (
                   <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
                <span className="sr-only">Notificações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notificações</span>
                {notifications.length > 0 && (
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={markAllNotificationsAsRead}>Marcar todas como lidas</Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.length > 0 ? (
                  notifications.map(n => {
                    const Icon = n.icon || BellRing;
                    const colorClass = n.color ? iconColorClasses[n.color] : 'text-primary';
                    return (
                      <DropdownMenuItem key={n.id} className="flex items-start gap-2 cursor-pointer" onSelect={() => markNotificationAsRead(n.id)}>
                        {!n.read && <Circle className="h-2 w-2 mt-1.5 fill-primary text-primary" />}
                        <Icon className={cn("h-4 w-4 mt-1", n.read ? "text-muted-foreground" : colorClass)}/>
                        <div className="flex-1">
                           <p className={cn("text-sm font-medium", n.read && "text-muted-foreground")}>{n.title}</p>
                           <p className="text-xs text-muted-foreground">{n.description}</p>
                           <p className="text-xs text-muted-foreground/70 mt-1">{formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ptBR })}</p>
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">Nenhuma notificação nova.</p>
                )}
              </ScrollArea>
               {notifications.length > 0 && (
                 <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center" onSelect={clearNotifications}>
                    Limpar Notificações
                  </DropdownMenuItem>
                 </>
               )}
            </DropdownMenuContent>
          </DropdownMenu>

          <UserNav isAdmin={isAdminArea} />
        </div>
      </div>
    </header>
  );
}
