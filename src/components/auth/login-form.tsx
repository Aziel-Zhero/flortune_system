"use client";

import Link from "next/link";
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.22c-.46 2.07-2.13 3.42-4.09 3.42a5.34 5.34 0 0 1-5.34-5.34a5.34 5.34 0 0 1 5.34-5.34c1.41 0 2.42.52 3.2 1.26l1.96-1.96A8.74 8.74 0 0 0 12.18 2a9.34 9.34 0 0 0-9.34 9.34a9.34 9.34 0 0 0 9.34 9.34c5.04 0 8.92-3.76 8.92-8.92c0-.61-.05-1.11-.15-1.56Z"/>
  </svg>
);

export function LoginForm() {
  const router = useRouter();

  const handleMockLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
      title: "Login Simulado",
      description: "Redirecionando para o painel...",
    });
    router.push('/dashboard');
  };
  
  const handleGoogleSignIn = () => {
    toast({
      title: "Login com Google (Desativado)",
      description: "A autenticação foi desativada. Redirecionando para o painel.",
    });
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Modo de Demonstração</AlertTitle>
        <AlertDescription>A autenticação está desativada. Qualquer ação simulará um login bem-sucedido.</AlertDescription>
      </Alert>

      <form onSubmit={handleMockLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" className="pl-10"/>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="#" className="text-sm text-primary hover:underline" onClick={(e) => e.preventDefault()}>
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Entrar (Simulado) <LogIn className="ml-2 h-4 w-4" />
        </Button>
      </form>
      <Separator />
      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
          <GoogleIcon /> Entrar com Google (Simulado)
        </Button>
      </div>
    </div>
  );
}
