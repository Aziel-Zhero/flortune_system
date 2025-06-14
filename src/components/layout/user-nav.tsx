
"use client";

import { Link } from "next-intl/client"; // Corrected for client components
import { useTranslations } from "next-intl";
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
import { useRouter } from "next-intl/client"; // Corrected for client components
import { DEFAULT_USER } from "@/lib/constants";


export function UserNav() {
  const t = useTranslations('UserNav');
  const router = useRouter();

  const handleLogout = async () => {
    // Placeholder for actual logout logic (e.g., clearing session, calling API)
    console.log("Logging out...");
    router.push("/login"); // Redirects to login page within the current locale
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={DEFAULT_USER.avatarUrl} alt={DEFAULT_USER.name} data-ai-hint="woman nature"/>
            <AvatarFallback>{DEFAULT_USER.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-headline">{DEFAULT_USER.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {DEFAULT_USER.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <User className="mr-2 h-4 w-4" />
              <span>{t('profile')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('settings')}</span>
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            {/* Assuming support page is part of settings or a new page */}
            <Link href="/settings"> 
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>{t('support')}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
