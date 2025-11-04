// src/components/auth/admin-login-form.tsx
"use client";

import { LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();

  const handleAdminLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real scenario, you would validate credentials against an admin table/role
    toast({
      title: "Login de Admin Simulado",
      description: "Redirecionando para o painel de administração...",
    });
    router.push('/dashboard-admin');
  };

  return (
    <form onSubmit={handleAdminLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email de Administrador</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" name="email" type="email" placeholder="admin@flortune.com" className="pl-10"/>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Entrar no Painel <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
