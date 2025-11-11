// src/components/auth/login-form.tsx
"use client";

import { useFormState } from "react-dom";
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
import { SubmitButton } from "./submit-button";
import { signIn } from 'next-auth/react';
import { OAuthButton } from "./oauth-button";
import { authenticate } from "@/app/actions/auth.actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const formError = searchParams.get("error");
  
  const [state, formAction] = useFormState(authenticate.bind(null, callbackUrl), undefined);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Login bem-sucedido!",
        description: "Redirecionando para o painel...",
      });
      router.push(callbackUrl);
    }
  }, [state, router, callbackUrl]);

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

      {state?.errors?._form && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro no Login</AlertTitle>
          <AlertDescription>{state.errors._form.join(", ")}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" className="pl-10"/>
          </div>
          {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email.join(", ")}</p>}
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
           {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password.join(", ")}</p>}
        </div>
        <SubmitButton pendingText="Entrando...">
          Entrar <LogIn className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      <Separator />
      <div className="space-y-2">
         <OAuthButton
            providerName="Google"
            buttonText="Entrar com Google"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          />
      </div>
    </div>
  );
}
