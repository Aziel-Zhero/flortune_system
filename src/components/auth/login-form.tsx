// src/components/auth/login-form.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { useFormState } from "react-dom";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OAuthButton } from "./oauth-button";
import { loginUser, type LoginFormState } from "@/app/actions/auth.actions";
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";


export function LoginForm() {
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");
  
  const initialState: LoginFormState = { message: "", success: false };
  const [state, formAction] = useFormState(loginUser, initialState);

  useEffect(() => {
    if (formError === "OAuthAccountNotLinked") {
        toast({
            title: "Email já em uso",
            description: "Este email já foi usado com outro método de login. Tente entrar com o método original.",
            variant: "destructive",
        });
    }
    // Mostra o erro do useFormState como um toast
    if (state?.errors?._form) {
      toast({
        title: "Erro no Login",
        description: state.errors._form.join(', '),
        variant: "destructive",
      });
    }
  }, [formError, state]);


  return (
    <div className="space-y-6">
      {/* O alerta de erro agora é tratado pelo toast */}
      
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" className="pl-10" required />
          </div>
           {state?.errors?.email && <p className="text-sm text-destructive mt-1">{state.errors.email[0]}</p>}
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
          {state?.errors?.password && <p className="text-sm text-destructive mt-1">{state.errors.password[0]}</p>}
        </div>
        
        <SubmitButton pendingText="Entrando...">
          Entrar <LogIn className="ml-2 h-4 w-4" />
        </SubmitButton>
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
