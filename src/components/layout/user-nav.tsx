
"use client";

import Link from "next/link";
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
import { LogOut, User, Settings, LifeBuoy } from "lucide-react";
import { logoutUser } from "@/app/actions/auth.actions";
import { useAuth } from "@/contexts/auth-context"; // Usar o hook de autenticação

export function UserNav() {
  const { user, profile, isLoading } = useAuth(); // Obter dados do usuário e perfil

  const handleLogout = async () => {
    await logoutUser(); // Chama server action, que redireciona
  };

  if (isLoading) {
    // Pode mostrar um skeleton ou um placeholder enquanto carrega
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    );
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || "Usuário";
  const userEmail = user?.email || "Não disponível";
  // Prioriza avatar do perfil, depois do OAuth (se disponível no user.user_metadata), depois placeholder
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${displayName.charAt(0).toUpperCase()}`;
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
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
            <Link href="/settings"> {/* Perfil agora é parte de Configurações */}
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
           <DropdownMenuItem onClick={() => alert("Funcionalidade de Suporte (placeholder)")}> {/* Placeholder */}
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>Suporte</span>
           </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
