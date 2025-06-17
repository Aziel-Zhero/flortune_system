
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
// import { logoutUser } from "@/app/actions/auth.actions"; // Usaremos signOut do NextAuth
import { useSession, signOut } from "next-auth/react"; // Importa useSession e signOut do NextAuth

export function UserNav() {
  const { data: session, status } = useSession(); // Usa o hook useSession

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login?logout=success' }); // signOut do NextAuth
  };

  if (status === "loading") {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    // Se não autenticado, pode não mostrar nada ou um botão de login, dependendo do design
    // Para este componente, que geralmente está em um layout protegido, é mais provável que não seja renderizado
    // ou que a lógica de proteção de rota já tenha redirecionado.
    // No entanto, como AppHeader pode ser visível brevemente, retornamos um placeholder.
    return  <div className="h-9 w-9 rounded-full bg-muted" />;
  }
  
  // Usa os dados da sessão do NextAuth
  const userProfile = session.user.profile; // Perfil completo do nosso banco
  const displayName = userProfile?.display_name || session.user.name || "Usuário";
  const userEmail = userProfile?.email || session.user.email || "Não disponível";
  const avatarUrl = userProfile?.avatar_url || session.user.image || `https://placehold.co/100x100.png?text=${displayName.charAt(0).toUpperCase()}`;
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
           <DropdownMenuItem onClick={() => alert("Funcionalidade de Suporte (placeholder)")}>
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
