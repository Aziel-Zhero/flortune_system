"use client";

import Link from "next/link"; // Usando next/link
import { Leaf, Eye, EyeOff, Search, Bell, Menu } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "./user-nav";
import { useAppSettings } from "@/hooks/use-app-settings";
import { cn } from "@/lib/utils";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function AppHeader() {
  const { isPrivateMode, togglePrivateMode } = useAppSettings();
  const { isMobile, setOpenMobile } = useSidebar(); 

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b bg-background/80 backdrop-blur-md h-16">
      <div className="container mx-auto flex h-full items-center space-x-4 px-4 sm:justify-between sm:space-x-0 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)} className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          )}
           <div className="hidden md:flex">
             <SidebarTrigger />
           </div>
          <Link href="/dashboard" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
            <Leaf className="h-7 w-7" />
            <span className="font-bold text-xl font-headline hidden sm:inline-block">{APP_NAME}</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
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
            className={cn("h-9 w-9", isPrivateMode && "text-accent hover:text-accent/90")}
          >
            {isPrivateMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notificações</span>
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
