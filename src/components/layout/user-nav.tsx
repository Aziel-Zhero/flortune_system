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
import { LogOut, User, Settings, LifeBuoy, MapPin, BarChart3 } from "lucide-react";
import { WeatherSettingsDialog } from "@/components/settings/weather-dialog";
import { QuoteSettingsDialog } from "@/components/settings/quote-dialog";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const mockUser = {
  displayName: "Usuário",
  userEmail: "usuario@exemplo.com",
  fallbackInitial: "U",
  avatarUrl: `https://placehold.co/100x100.png?text=U`,
};
const mockAdmin = {
  displayName: "Admin",
  userEmail: "admin@flortune.com",
  fallbackInitial: "A",
  avatarUrl: `https://placehold.co/100x100/fca5a5/1e293b?text=A`,
};


interface UserNavProps {
  isAdmin?: boolean;
}

export function UserNav({ isAdmin = false }: UserNavProps) {
  const router = useRouter();
  const [isWeatherDialogOpen, setIsWeatherDialogOpen] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  
  const user = isAdmin ? mockAdmin : mockUser;

  const handleLogout = () => {
    toast({ title: "Logout simulado", description: "Você será redirecionado para a página de login."});
    const logoutUrl = isAdmin ? '/login-admin' : '/login';
    router.push(logoutUrl);
  };
  
  const profileUrl = isAdmin ? '/admin/profile' : '/profile';
  const settingsUrl = isAdmin ? '/admin/settings' : '/settings';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl} alt={user.displayName} data-ai-hint="user avatar" />
              <AvatarFallback>{user.fallbackInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none font-headline">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={profileUrl}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={settingsUrl}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            {!isAdmin && (
              <>
                <DropdownMenuItem onClick={() => setIsQuoteDialogOpen(true)} className="cursor-pointer">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Configurar Cotações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsWeatherDialogOpen(true)} className="cursor-pointer">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Configurar Clima</span>
                </DropdownMenuItem>
              </>
            )}
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
      {!isAdmin && (
        <>
          <WeatherSettingsDialog isOpen={isWeatherDialogOpen} onOpenChange={setIsWeatherDialogOpen} />
          <QuoteSettingsDialog isOpen={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen} />
        </>
      )}
    </>
  );
}
