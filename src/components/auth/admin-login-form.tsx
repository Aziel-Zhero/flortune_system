// src/components/auth/admin-login-form.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { LogIn, KeyRound, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { adminLogin } from "@/app/actions/admin-auth.actions";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar no Painel"}
            {!pending && <LogIn className="ml-2 h-4 w-4" />}
        </Button>
    );
}

export function AdminLoginForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(adminLogin, { success: false });

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Login Bem-sucedido!",
        description: "Redirecionando para o painel de administração...",
      });
      router.push('/dashboard-admin');
    } else if (state.message) {
      toast({
        title: "Erro no Login",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Falha no Login</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
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
      <SubmitButton />
    </form>
  );
}
