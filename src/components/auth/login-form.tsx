
"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loginUser, type LoginFormState } from "@/app/actions/auth.actions"; // Usará a action atualizada
// import { OAuthButton } from "./oauth-button"; // Google login será re-adicionado depois
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react"; // Usar signIn do cliente para feedback melhor
import { useRouter } from "next/navigation";

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // const initialState: LoginFormState = { message: undefined, errors: {}, success: undefined };
  // const [state, dispatch] = useActionState(loginUser, initialState); // Server action pode ser usada como fallback ou para lógicas mais complexas

  useEffect(() => {
    const signupStatus = searchParams.get('signup');
    const errorParam = searchParams.get('error'); // Erros do NextAuth vêm por aqui

    if (signupStatus === 'success') {
       toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso. Por favor, faça o login.",
        variant: "default",
        duration: 7000,
      });
    }
    
    if (errorParam) {
      let friendlyError = "Falha no login. Verifique suas credenciais.";
      if (errorParam === "CredentialsSignin") {
        friendlyError = "Email ou senha inválidos.";
      } else if (errorParam === "OAuthAccountNotLinked") {
        // ... outros erros do NextAuth
      }
      setError(friendlyError);
      toast({
        title: "Erro de Login",
        description: friendlyError,
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validação básica no cliente
    if (!email || !password) {
        setError("Email e senha são obrigatórios.");
        setIsLoading(false);
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Formato de email inválido.");
        setIsLoading(false);
        return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false, // Importante para manipular o resultado aqui
        email,
        password,
      });

      if (result?.error) {
        console.error("LoginForm: NextAuth signIn error:", result.error);
        let friendlyError = "Falha no login. Verifique suas credenciais.";
        if (result.error === "CredentialsSignin") {
            friendlyError = "Email ou senha inválidos.";
        }
        setError(friendlyError);
        toast({ title: "Erro de Login", description: friendlyError, variant: "destructive" });
      } else if (result?.ok && result?.url) {
        // Login bem-sucedido, NextAuth tentaria redirecionar se redirect:true
        // Como redirect:false, redirecionamos manualmente.
        // O callbackUrl pode ser pego dos searchParams se necessário.
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
        toast({ title: "Login bem-sucedido!", description: "Redirecionando..."});
      } else {
        // Caso inesperado
        setError("Ocorreu um erro desconhecido durante o login.");
        toast({ title: "Erro", description: "Ocorreu um erro desconhecido.", variant: "destructive" });
      }
    } catch (e) {
      console.error("LoginForm: Exception during signIn:", e);
      setError("Ocorreu um erro no servidor. Tente novamente.");
      toast({ title: "Erro no Servidor", description: "Não foi possível processar seu login.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  

  // const handleGoogleSignIn = async () => {
  //   setIsLoading(true);
  //   await signIn('google', { callbackUrl: '/dashboard' }); 
  //   // Quando o provider Google for adicionado em auth.ts
  //   setIsLoading(false);
  // };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Falha no Login</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
              disabled={isLoading}
            />
          </div>
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
              disabled={isLoading}
            />
          </div>
        </div>
        <SubmitButton pendingText="Entrando..." disabled={isLoading}>
          Entrar <LogIn className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      <Separator />
      {/* <OAuthButton providerName="Google" Icon={LogIn} action={handleGoogleSignIn} buttonText="Entrar com Google" disabled={isLoading}/> */}
      <p className="text-center text-sm text-muted-foreground">
        Login com Google temporariamente desabilitado.
      </p>
    </div>
  );
}
