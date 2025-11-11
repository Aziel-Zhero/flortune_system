// src/components/auth/login-form.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react";
import { OAuthButton } from "./oauth-button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");
  
  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode fazer o login com suas credenciais.",
        variant: "default",
      });
    }
  }, [searchParams]);

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

      <form action={async (formData) => {
        const result = await signIn("credentials", {
          redirect: false,
          email: formData.get("email"),
          password: formData.get("password"),
        });

        if (result?.error) {
          router.push('/login?error=CredentialsSignin');
        } else {
          router.push(searchParams.get("callbackUrl") || "/dashboard");
          router.refresh();
        }
      }} className="space-y-4">
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
            <Link href="#" className="text-sm text-primary hover:underline" tabIndex={-1}>
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Entrar <LogIn className="ml-2 h-4 w-4" />
        </Button>
      </form>
      <Separator />
      <div className="space-y-2">
         <OAuthButton
            providerName="Google"
            buttonText="Entrar com Google"
          />
      </div>
    </div>
  );
}
