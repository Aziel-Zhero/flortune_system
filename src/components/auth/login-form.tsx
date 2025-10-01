
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, LogIn, KeyRound, Mail, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react"; 

// Placeholder Google icon as SVG component
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.22c-.46 2.07-2.13 3.42-4.09 3.42a5.34 5.34 0 0 1-5.34-5.34a5.34 5.34 0 0 1 5.34-5.34c1.41 0 2.42.52 3.2 1.26l1.96-1.96A8.74 8.74 0 0 0 12.18 2a9.34 9.34 0 0 0-9.34 9.34a9.34 9.34 0 0 0 9.34 9.34c5.04 0 8.92-3.76 8.92-8.92c0-.61-.05-1.11-.15-1.56Z"/>
  </svg>
);

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDevLoading, setIsDevLoading] = useState(false);

  useEffect(() => {
    const signupStatus = searchParams.get('signup');
    const errorParam = searchParams.get('error'); 
    const logoutStatus = searchParams.get('logout');

    if (signupStatus === 'success') {
       toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso. Por favor, faça o login.",
        variant: "default",
        duration: 7000,
      });
      const newPath = window.location.pathname;
      window.history.replaceState({...window.history.state, as: newPath, url: newPath }, '', newPath);
    }
    
    if (logoutStatus === 'success') {
      toast({
        title: "Logout Efetuado",
        description: "Você saiu da sua conta com sucesso.",
        variant: "default",
        duration: 5000,
      });
      const newPath = window.location.pathname;
      window.history.replaceState({...window.history.state, as: newPath, url: newPath }, '', newPath);
    }
    
    if (errorParam) {
      let friendlyError = "Falha no login. Verifique suas credenciais ou tente outra forma de login.";
      if (errorParam === "CredentialsSignin") {
        friendlyError = "Email ou senha inválidos.";
      } else if (errorParam === "OAuthAccountNotLinked") {
        friendlyError = "Esta conta de email já foi usada com outro provedor. Tente fazer login com o provedor original.";
      } else if (errorParam === "Callback") {
        friendlyError = "Erro ao processar o login com o provedor externo. Tente novamente."
      } else if (errorParam === "OAuthSignin") {
        friendlyError = "Erro ao tentar entrar com o Google. Tente novamente."
      }
      setError(friendlyError);
      toast({
        title: "Erro de Login",
        description: friendlyError,
        variant: "destructive",
      });
      const newPath = window.location.pathname;
      window.history.replaceState({...window.history.state, as: newPath, url: newPath }, '', newPath);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        setError("Email e senha são obrigatórios.");
        setIsLoading(false);
        return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false, 
        email,
        password,
      });

      if (result?.error) {
        setError("Email ou senha inválidos.");
        toast({ title: "Erro de Login", description: "Email ou senha inválidos.", variant: "destructive" });
      } else if (result?.ok) {
        router.push(searchParams.get('callbackUrl') || '/dashboard');
        toast({ title: "Login bem-sucedido!", description: "Redirecionando..."});
      }
    } catch (e) {
      setError("Ocorreu um erro no servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signIn('google', { callbackUrl: searchParams.get('callbackUrl') || '/dashboard' }); 
    } catch(e) {
       setError("Falha ao iniciar login com Google.");
       setIsGoogleLoading(false);
    }
  };

  const handleDevSignIn = async () => {
    setIsDevLoading(true);
    setError(null);
    try {
      const result = await signIn('dev', {
        redirect: false,
        email: 'dev@flortune.com',
      });
       if (result?.ok) {
        router.push('/dashboard');
        toast({ title: "Acesso de Desenvolvedor", description: "Login efetuado com sucesso."});
      } else {
        throw new Error(result?.error || "Falha no login de desenvolvedor");
      }
    } catch(e: any) {
       setError("Falha ao usar Acesso DEV.");
       toast({ title: "Erro no Acesso DEV", description: e.message, variant: "destructive" });
       setIsDevLoading(false);
    }
  };

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
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" required className="pl-10" disabled={isLoading || isGoogleLoading || isDevLoading}/>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="#" className="text-sm text-primary hover:underline" onClick={(e) => {e.preventDefault(); alert("Funcionalidade 'Esqueceu a senha?' em desenvolvimento.")}}>
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" name="password" type="password" required placeholder="••••••••" className="pl-10" disabled={isLoading || isGoogleLoading || isDevLoading} />
          </div>
        </div>
        <SubmitButton pendingText="Entrando..." disabled={isLoading || isGoogleLoading || isDevLoading}>
          Entrar <LogIn className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      <Separator />
      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading || isDevLoading}>
          {isGoogleLoading ? "Redirecionando..." : (<><GoogleIcon /> Entrar com Google</>)}
        </Button>
        {process.env.NODE_ENV !== 'production' && (
          <Button variant="secondary" className="w-full" onClick={handleDevSignIn} disabled={isLoading || isGoogleLoading || isDevLoading}>
             {isDevLoading ? "Entrando..." : (<><TestTube className="mr-2 h-4 w-4"/> Acesso DEV</>)}
          </Button>
        )}
      </div>
    </div>
  );
}
