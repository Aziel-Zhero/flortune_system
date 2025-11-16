
// src/app/setup-admin/page.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { setupAdminUser } from "@/app/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, UserPlus, ShieldCheck, KeyRound, Mail, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
      {pending ? "Criando..." : "Criar Administrador"}
    </Button>
  );
}

const initialState = {
  success: false,
  error: null as string | null,
  message: null as string | null,
};

export default function SetupAdminPage() {
  const [state, formAction] = useFormState(setupAdminUser, initialState);

  useEffect(() => {
    if (state.success && state.message) {
      toast({
        title: "Sucesso!",
        description: state.message,
      });
    } else if (state.error) {
      toast({
        title: "Erro",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">{APP_NAME}</h1>
            <p className="text-muted-foreground">Setup do Administrador</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Criar Primeiro Administrador</CardTitle>
            <CardDescription>
              Use este formulário para criar a conta principal de administrador do sistema.
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-4">
              {state.success ? (
                <Alert variant="default" className="bg-emerald-50 border-emerald-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-700">Administrador Criado!</AlertTitle>
                  <AlertDescription className="text-emerald-600">
                    {state.message} Agora você pode fazer o login na tela principal.
                    <Button asChild variant="link" className="p-0 h-auto ml-1">
                      <Link href="/login">Ir para Login</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                {state.error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email do Administrador</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" name="email" type="email" required className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                     <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" name="password" type="password" required className="pl-10"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretCode">Código Secreto</Label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="secretCode" name="secretCode" type="password" required className="pl-10" />
                    </div>
                    <p className="text-xs text-muted-foreground">Este código garante que apenas alguém com acesso ao código-fonte pode criar o primeiro admin.</p>
                  </div>
                </>
              )}
            </CardContent>
            {!state.success && (
              <CardFooter>
                <SubmitButton />
              </CardFooter>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
