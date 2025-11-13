// src/components/auth/admin-login-form.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { LogIn, KeyRound, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { adminLogin, type AdminLoginFormState } from "@/app/actions/admin-auth.actions";
import { SubmitButton } from "./submit-button";

const initialState: AdminLoginFormState = {
  success: false,
  message: "",
};

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");

  const [state, formAction] = useFormState(adminLogin, initialState);

  useEffect(() => {
    if (formError === "CredentialsSignin") {
      toast({
        title: "Erro de Login",
        description: "Credenciais de administrador inválidas.",
        variant: "destructive",
      });
      router.replace('/login-admin', { scroll: false });
    }
  }, [formError, router]);
  
  useEffect(() => {
    if (state.success === false && state.message) {
      toast({
        title: "Falha no Login",
        description: state.message,
        variant: "destructive"
      });
    } else if (state.success === true) {
       toast({
          title: "Login Bem-sucedido!",
          description: "Redirecionando para o painel de administração...",
        });
       router.push('/dashboard-admin');
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className="space-y-4"
    >
      {(formError || (state && !state.success && state.message)) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Falha no Login</AlertTitle>
          <AlertDescription>
            {state?.message || "Email ou senha de administrador inválidos."}
          </AlertDescription>
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
      <SubmitButton pendingText="Entrando...">
        Entrar no Painel <LogIn className="ml-2 h-4 w-4" />
      </SubmitButton>
    </form>
  );
}
