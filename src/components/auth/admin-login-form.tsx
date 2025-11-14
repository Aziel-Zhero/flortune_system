// src/components/auth/admin-login-form.tsx
"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { KeyRound, Mail, LogIn } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "./submit-button";
import { adminLogin, type LoginFormState } from "@/app/actions/auth.actions";

export function AdminLoginForm() {
  const initialState: LoginFormState = { message: "" };
  const [state, formAction] = useFormState(adminLogin, initialState);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: "Erro no Login",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email de Administrador</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" name="email" type="email" placeholder="admin@exemplo.com" className="pl-10" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="password" name="password" type="password" className="pl-10" required />
        </div>
      </div>
      <SubmitButton pendingText="Acessando...">
        Entrar no Workspace <LogIn className="ml-2 h-4 w-4" />
      </SubmitButton>
    </form>
  );
}