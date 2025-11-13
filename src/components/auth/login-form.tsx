// src/components/auth/login-form.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signIn } from "next-auth/react";
import { OAuthButton } from "./oauth-button";

export function LoginForm() {
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <div className="space-y-6">
      {formError === "OAuthAccountNotLinked" && (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Email já em uso</AlertTitle>
            <AlertDescription>
                Este email já foi usado com outro método de login. Tente entrar com o método original.
            </AlertDescription>
         </Alert>
      )}

      {formError === "CredentialsSignin" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro no Login</AlertTitle>
          <AlertDescription>Email ou senha inválidos. Por favor, tente novamente.</AlertDescription>
        </Alert>
      )}

      <form 
        action={async (formData) => {
          await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: callbackUrl, // Usar redirectTo para forçar o reload
          });
        }} 
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" className="pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="#" className="text-sm text-primary hover:underline" tabIndex={-1}>
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Entrar <LogIn className="ml-2 h-4 w-4" />
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>
      
      <OAuthButton
        providerName="Google"
        buttonText="Entrar com Google"
      />
    </div>
  );
}
