// src/components/auth/login-form.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, KeyRound, Mail, Loader2, AlertCircle } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButton } from "./oauth-button";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useSession } from "@/contexts/auth-context";

interface LoginFormProps {
  message?: string;
}

export function LoginForm({ message }: LoginFormProps) {
  const router = useRouter();
  const { session } = useSession();
  const [error, setError] = useState<string | null>(message || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      const isAdmin = session.user?.profile?.role === 'admin';
      router.replace(isAdmin ? '/dashboard-admin' : '/dashboard');
    }
  }, [session, router]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    if (!supabase) {
        setError("O serviço de autenticação não está disponível.");
        setIsSubmitting(false);
        return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      let friendlyError = "Credenciais inválidas. Verifique seu e-mail e senha.";
      if (signInError.message.includes("Email not confirmed")) {
          friendlyError = "Você precisa confirmar seu e-mail antes de fazer login.";
      }
      setError(friendlyError);
      toast({
          title: "Erro no Login",
          description: friendlyError,
          variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (data.user) {
        // A lógica de redirecionamento agora é tratada pelo useEffect que observa a mudança de sessão.
        // Apenas recarregamos a página para garantir que o layout principal reavalie a sessão.
        router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Login</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" className="pl-10" required disabled={isSubmitting} />
          </div>
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
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required disabled={isSubmitting} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
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
      
      <div className="space-y-2">
        <OAuthButton
          provider="google"
          buttonText="Entrar com Google"
        />
        <OAuthButton
          provider="github"
          buttonText="Entrar com GitHub"
        />
      </div>
    </div>
  );
}
