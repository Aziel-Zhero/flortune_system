// src/components/auth/login-form.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/auth.actions";
import { LogIn, KeyRound, Mail, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButton } from "./oauth-button";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface LoginFormProps {
  message?: string;
}

export function LoginForm({ message }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(message || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (message) {
      setError(message);
    }
  }, [message]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await loginUser(null, formData);

    if (result?.error) {
      setError(result.error);
      toast({
          title: "Erro no Login",
          description: result.error,
          variant: "destructive",
      });
      setIsSubmitting(false);
    } else if (result?.redirectTo) {
      // Client-side redirection
      router.push(result.redirectTo);
      router.refresh(); // Força a atualização do layout e da sessão
    } else {
      // Fallback
      toast({
          title: "Erro inesperado",
          description: "Não foi possível completar o login. Tente novamente.",
          variant: "destructive",
      });
      setIsSubmitting(false);
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
      
      <OAuthButton
        provider="google"
        buttonText="Entrar com Google"
      />
    </div>
  );
}
