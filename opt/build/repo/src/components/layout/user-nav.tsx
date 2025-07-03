
"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, LifeBuoy, Thermometer } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { WeatherSettingsDialog } from "@/components/settings/weather-dialog";

export function UserNav() {
  const { data: session, status } = useSession();
  const [isWeatherDialogOpen, setIsWeatherDialogOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login?logout=success' });
  };

  if (status === "loading") {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return  <div className="h-9 w-9 rounded-full bg-muted" />;
  }

  const userProfile = session.user.profile;
  const displayName = userProfile?.display_name || session.user.name || "Usuário";
  const userEmail = userProfile?.email || session.user.email || "Não disponível";
  const fallbackInitial = (displayName === "Usuário" && session.user.name) 
                          ? session.user.name.charAt(0).toUpperCase() 
                          : displayName.charAt(0).toUpperCase() || "U";
  const avatarUrl = userProfile?.avatar_url || session.user.image || `https://placehold.co/100x100.png?text=${fallbackInitial}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar" />
              <AvatarFallback>{fallbackInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none font-headline">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => setIsWeatherDialogOpen(true)} className="cursor-pointer">
                <Thermometer className="mr-2 h-4 w-4" />
                <span>Configurar Clima</span>
             </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/help">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Ajuda</span>
                </Link>
             </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <WeatherSettingsDialog isOpen={isWeatherDialogOpen} onOpenChange={setIsWeatherDialogOpen} />
    </>
  );
}
