
"use client";

import Link from "next-intl/link"; // Use next-intl's Link
import { Leaf, Eye, EyeOff, Search, Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "./user-nav";
import { useAppSettings } from "@/hooks/use-app-settings";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";


export function AppHeader() {
  const { isPrivateMode, togglePrivateMode } = useAppSettings();
  const t = useTranslations('AppHeader');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="md:hidden">
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
                placeholder={t('searchPlaceholder')}
                className="pl-10 h-9"
              />
            </div>
          </form>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePrivateMode}
            aria-label={isPrivateMode ? "Disable private mode" : "Enable private mode"} // Consider translating aria-label if needed
            className={cn("h-9 w-9", isPrivateMode && "text-accent hover:text-accent/90")}
          >
            {isPrivateMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
