// src/components/auth/admin-login-form.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";


const adminLoginSchema = z.object({
  email: z.string().email("Por favor, insira um email válido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;


export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");
  const callbackUrl = "/dashboard-admin";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  useEffect(() => {
    if (formError) {
      toast({
        title: "Erro de Login",
        description: formError === 'CredentialsSignin' ? "Credenciais de administrador inválidas." : "Ocorreu um erro durante o login.",
        variant: "destructive",
      });
      // Limpa o erro da URL para não mostrar o toast repetidamente
      router.replace('/login-admin', { scroll: false });
    }
  }, [formError, router]);
  
  const onSubmit: SubmitHandler<AdminLoginFormData> = async (data) => {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false, // Não redireciona automaticamente para tratar o erro
    });

    if (result?.error) {
       toast({
        title: "Falha no Login",
        description: "Email ou senha de administrador inválidos.",
        variant: "destructive"
      });
    } else if (result?.ok) {
       toast({
          title: "Login Bem-sucedido!",
          description: "Redirecionando para o painel de administração...",
        });
       router.push(callbackUrl);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email de Administrador</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" type="email" placeholder="admin@flortune.com" className="pl-10" {...register("email")} />
        </div>
         {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="password" type="password" placeholder="••••••••" className="pl-10" {...register("password")} />
        </div>
         {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Entrando..." : "Entrar no Painel"} <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
