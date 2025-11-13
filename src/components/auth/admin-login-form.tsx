// src/components/auth/admin-login-form.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LogIn, KeyRound, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signIn } from "next-auth/react";
import { toast } from "@/hooks/use-toast";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = "/dashboard-admin";

  useEffect(() => {
    if (error === "CredentialsSignin") {
      toast({
        title: "Erro no Login",
        description: "Credenciais de administrador inválidas.",
        variant: "destructive",
      });
      // Limpa o erro da URL para não mostrar o toast novamente no refresh
      router.replace('/login-admin', { scroll: false });
    }
  }, [error, router]);

  return (
    <form
      action={async (formData) => {
        const result = await signIn("credentials", {
          redirect: false, // Não redireciona automaticamente para podermos tratar o erro
          email: formData.get("email"),
          password: formData.get("password"),
          callbackUrl,
        });
        if (result?.ok && !result.error) {
           toast({
            title: "Login Bem-sucedido!",
            description: "Redirecionando para o painel de administração...",
          });
          router.push(callbackUrl);
        }
      }}
      className="space-y-4"
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Falha no Login</AlertTitle>
          <AlertDescription>Email ou senha de administrador inválidos.</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email de Administrador</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" name="email" type="email" placeholder="admin@flortune.com" className="pl-10" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Entrar no Painel <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}