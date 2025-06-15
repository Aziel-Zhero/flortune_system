
"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loginUser, signInWithOAuth, type LoginFormState } from "@/app/actions/auth.actions";
import { OAuthButton } from "./oauth-button";
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";

export function LoginForm() {
  const searchParams = useSearchParams();
  const initialState: LoginFormState = { message: undefined, errors: {}, success: undefined };
  const [state, dispatch] = useActionState(loginUser, initialState);

  useEffect(() => {
    const signupStatus = searchParams.get('signup');
    const errorParam = searchParams.get('error');

    if (signupStatus === 'success_email_confirmation') {
      toast({
        title: "Cadastro realizado!",
        description: "Enviamos um email de confirmação. Por favor, verifique sua caixa de entrada para ativar sua conta e depois faça login.",
        variant: "default",
        duration: 10000, // Manter por mais tempo
      });
    } else if (signupStatus === 'success') {
       toast({
        title: "Sucesso!",
        description: "Sua conta foi criada. Por favor, faça o login.",
        variant: "default"
      });
    }

    if (errorParam) {
      toast({
        title: "Erro de Autenticação",
        description: decodeURIComponent(errorParam) || "Ocorreu um erro durante a autenticação.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (state?.message && !state.success) {
      // Erros específicos de campo são tratados abaixo.
      // Exibir apenas erros gerais do formulário (_form) aqui, ou mensagens de erro globais.
      if (state.errors?._form) {
        // Já exibido pela Alert
      } else {
          toast({
            title: "Erro de Login",
            description: state.message,
            variant: "destructive",
          });
      }
    }
    // Sucesso é tratado por redirecionamento
  }, [state]);

  const handleGoogleSignIn = async () => {
    await signInWithOAuth('google');
  };

  return (
    <div className="space-y-6">
      <form action={dispatch} className="space-y-4">
        {state?.errors?._form && (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Falha no Login</AlertTitle>
            <AlertDescription>{state.errors._form.join(', ')}</AlertDescription>
          </Alert>
        )}
        {/* Removida a segunda Alert genérica para evitar duplicidade com toast */}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome@exemplo.com"
              required
              className="pl-10"
              aria-describedby="email-error"
            />
          </div>
          {state?.errors?.email && <p id="email-error" className="text-sm text-destructive">{state.errors.email.join(', ')}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="#" className="text-sm text-primary hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="pl-10"
              aria-describedby="password-error"
            />
          </div>
          {state?.errors?.password && <p id="password-error" className="text-sm text-destructive">{state.errors.password.join(', ')}</p>}
        </div>
        <SubmitButton pendingText="Entrando...">
          Entrar <LogIn className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      <Separator />
      {/* O OAuthButton agora chama a server action via form */}
      <OAuthButton providerName="Google" Icon={LogIn} action={handleGoogleSignIn} buttonText="Entrar com Google"/>
    </div>
  );
}
