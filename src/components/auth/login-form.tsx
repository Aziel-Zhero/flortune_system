"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react"; 
import { SubmitButton } from "./submit-button";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.22c-.46 2.07-2.13 3.42-4.09 3.42a5.34 5.34 0 0 1-5.34-5.34a5.34 5.34 0 0 1 5.34-5.34c1.41 0 2.42.52 3.2 1.26l1.96-1.96A8.74 8.74 0 0 0 12.18 2a9.34 9.34 0 0 0-9.34 9.34a9.34 9.34 0 0 0 9.34 9.34c5.04 0 8.92-3.76 8.92-8.92c0-.61-.05-1.11-.15-1.56Z"/>
  </svg>
);

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const signupStatus = searchParams.get('signup');
    const errorParam = searchParams.get('error'); 
    const logoutStatus = searchParams.get('logout');

    const newUrl = '/login';

    if (signupStatus === 'success') {
       toast({
        title: "Cadastro realizado com sucesso!",
        description: "Enviamos um e-mail de confirmação para você. Por favor, verifique sua caixa de entrada e spam para ativar sua conta.",
        variant: "default",
        duration: 15000,
      });
      window.history.replaceState(null, '', newUrl);
    }
    
    if (logoutStatus === 'success') {
      toast({
        title: "Logout Efetuado",
        description: "Você saiu da sua conta com sucesso.",
        variant: "default",
        duration: 5000,
      });
      window.history.replaceState(null, '', newUrl);
    }
    
    if (errorParam) {
      let friendlyError = "Falha no login. Verifique suas credenciais ou tente outra forma de login.";
      if (errorParam === "CredentialsSignin") {
        friendlyError = "Email ou senha inválidos. Verifique também se seu e-mail foi confirmado.";
      } else if (errorParam === "OAuthAccountNotLinked") {
        friendlyError = "Esta conta de email já foi usada com outro provedor. Tente fazer login com o provedor original.";
      }
      setError(friendlyError);
      window.history.replaceState(null, '', newUrl);
    }
  }, [searchParams]);

  const handleCredentialsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('📧 Tentando login com:', { email, passwordLength: password?.length });

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('🔐 Resultado completo do signIn:', result);

      if (result?.error) {
        console.error('❌ Erro do NextAuth:', result.error);
        
        let errorMessage = "Credenciais inválidas";
        if (result.error.includes('user') || result.error.includes('not found')) {
          errorMessage = "Usuário não encontrado";
        } else if (result.error.includes('password') || result.error.includes('incorrect')) {
          errorMessage = "Senha incorreta";
        } else if (result.error.includes('credentials')) {
          errorMessage = "Email ou senha inválidos";
        }
        
        setError(errorMessage);
        toast({ 
          title: "Falha no login", 
          description: errorMessage, 
          variant: "destructive" 
        });
      } 
      
      if (result?.ok && !result.error) {
        console.log('✅ Login bem-sucedido! Redirecionando...');
        toast({ 
          title: "Sucesso!", 
          description: "Login realizado com sucesso" 
        });
        
        // Força um refresh completo para garantir que a sessão seja carregada
        setTimeout(() => {
          const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
          window.location.href = callbackUrl;
        }, 1000);
      }
    } catch (e: any) {
      console.error('💥 Erro fatal no login:', e);
      setError("Erro interno do servidor");
      toast({ 
        title: "Erro", 
        description: "Falha na conexão", 
        variant: "destructive" 
      });
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" required className="pl-10" disabled={isLoading || isGoogleLoading}/>
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
            <Input id="password" name="password" type="password" required placeholder="••••••••" className="pl-10" disabled={isLoading || isGoogleLoading} />
          </div>
        </div>
        <SubmitButton pendingText="Entrando..." disabled={isLoading || isGoogleLoading}>
          Entrar <LogIn className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      <Separator />
      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
          {isGoogleLoading ? "Redirecionando..." : (<><GoogleIcon /> Entrar com Google</>)}
        </Button>
      </div>
    </div>
  );
}
