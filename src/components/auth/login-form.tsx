// src/components/auth/login-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, KeyRound, Mail, Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButton } from "./oauth-button";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (formError) {
      toast({
        title: "Erro de Login",
        description: "Não foi possível autenticar com o provedor OAuth.",
        variant: "destructive",
      });
    }
  }, [formError]);

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsSubmitting(true);

    if (!supabase) {
      toast({ title: "Erro de Configuração", description: "O serviço de autenticação não está disponível.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast({
        title: "Erro no Login",
        description: error.message === "Invalid login credentials" ? "Credenciais inválidas. Verifique seu e-mail e senha." : "Ocorreu um erro durante o login.",
        variant: "destructive",
      });
    } else {
      // O onAuthStateChange no AuthProvider vai cuidar de pegar o perfil e a sessão.
      // O redirecionamento será tratado pelo AppLayout.
      toast({ title: "Login bem-sucedido!", description: "Redirecionando para o seu painel." });
      router.push('/dashboard');
      router.refresh(); // Força a atualização do estado do layout
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="nome@exemplo.com" className="pl-10" {...register("email")} />
          </div>
          {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
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
            <Input id="password" type="password" placeholder="••••••••" className="pl-10" {...register("password")} />
          </div>
          {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
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
