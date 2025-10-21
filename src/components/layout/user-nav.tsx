// src/components/layout/user-nav.tsx

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
import { LogOut, User, Settings, LifeBuoy, MapPin } from "lucide-react";
import { WeatherSettingsDialog } from "@/components/settings/weather-dialog";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

// Mock user data as authentication is disabled
const mockUser = {
  displayName: "Usuário",
  userEmail: "usuario@exemplo.com",
  fallbackInitial: "U",
  avatarUrl: `https://placehold.co/100x100.png?text=U`,
};

export function UserNav() {
  const router = useRouter();
  const [isWeatherDialogOpen, setIsWeatherDialogOpen] = useState(false);

  const handleLogout = () => {
    toast({ title: "Logout simulado", description: "Em um app real, você seria desconectado."});
    router.push('/login');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={mockUser.avatarUrl} alt={mockUser.displayName} data-ai-hint="user avatar" />
              <AvatarFallback>{mockUser.fallbackInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none font-headline">{mockUser.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {mockUser.userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile">
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
                <MapPin className="mr-2 h-4 w-4" />
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
