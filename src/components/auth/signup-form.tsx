// src/components/auth/signup-form.tsx
"use client";

import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { UserPlus, KeyRound, Mail, User, Eye, EyeOff, CheckCircle, Loader2, AlertCircle, Building, UserCheck } from "lucide-react";
import { supabase } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { OAuthButton } from "./oauth-button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
  .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um caractere especial.");

const signupFormSchema = z.object({
  accountType: z.enum(['pessoa', 'empresa'], { required_error: 'Selecione o tipo de conta.'}),
  fullName: z.string().min(2, "Nome Completo ou Razão Social é obrigatório."),
  displayName: z.string().min(2, "Nome de Exibição ou Fantasia é obrigatório."),
  email: z.string().email("Email inválido."),
  password: passwordSchema,
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos e condições."
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupFormSchema>;

interface PasswordRequirement {
  id: "length" | "uppercase" | "lowercase" | "number" | "special";
  text: string;
  regex: RegExp;
}

const passwordRequirements: PasswordRequirement[] = [
  { id: "length", text: "Pelo menos 8 caracteres", regex: /.{8,}/ },
  { id: "uppercase", text: "Uma letra maiúscula (A-Z)", regex: /[A-Z]/ },
  { id: "lowercase", text: "Uma letra minúscula (a-z)", regex: /[a-z]/ },
  { id: "number", text: "Um número (0-9)", regex: /[0-9]/ },
  { id: "special", text: "Um caractere especial (!@#$...)", regex: /[^a-zA-Z0-9]/ },
];


export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(searchParams.get('error'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, register, watch, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    mode: "onBlur",
    defaultValues: {
        accountType: 'pessoa',
    }
  });

  const passwordValue = watch("password", "");
  const accountType = watch("accountType");

  const passwordCheck = passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(passwordValue)
  }));
  
  useEffect(() => {
    if (formError) {
      toast({
        title: "Erro no Cadastro",
        description: formError === 'user_already_exists' ? 'Este e-mail já está cadastrado.' : formError,
        variant: "destructive",
      });
    }
  }, [formError]);

  const handleFormSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setIsSubmitting(true);
    setFormError(null);

    if (!supabase) {
        setFormError("Serviço de autenticação indisponível.");
        setIsSubmitting(false);
        return;
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          display_name: data.displayName,
          account_type: data.accountType,
          avatar_url: `https://placehold.co/100x100.png?text=${data.displayName.charAt(0).toUpperCase()}`,
        },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      if(error.message.includes("User already registered")) {
        setFormError("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        setFormError(error.message);
      }
      setIsSubmitting(false);
    } else {
      // Redireciona para uma página de sucesso/verificação de e-mail
      router.push('/login?signup=success');
    }
  };

  return (
    <div className="space-y-6">
       {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Cadastro</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Conta</Label>
            <Controller
                name="accountType"
                control={control}
                render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                    <div>
                    <RadioGroupItem value="pessoa" id="pessoa" className="peer sr-only" />
                    <Label htmlFor="pessoa" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <UserCheck className="mb-3 h-6 w-6" />
                        Pessoa Física
                    </Label>
                    </div>
                    <div>
                    <RadioGroupItem value="empresa" id="empresa" className="peer sr-only" />
                    <Label htmlFor="empresa" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <Building className="mb-3 h-6 w-6" />
                        Pessoa Jurídica
                    </Label>
                    </div>
                </RadioGroup>
                )}
            />
            {errors.accountType && <p className="text-sm text-destructive mt-1">{errors.accountType.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="fullName">{accountType === 'pessoa' ? 'Nome Completo' : 'Razão Social'}</Label><Input id="fullName" {...register("fullName")} />{errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="displayName">{accountType === 'pessoa' ? 'Nome de Exibição' : 'Nome Fantasia'}</Label><Input id="displayName" {...register("displayName")} />{errors.displayName && <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>}</div>
          </div>
          
          <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="email" type="email" {...register("email")} className="pl-10"/></div>{errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}</div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="password">Senha</Label><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="password" type={showPassword ? "text" : "password"} {...register("password")} className="pl-10 pr-10"/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)}><EyeOff className={cn("h-4 w-4", { "hidden": !showPassword })} /><Eye className={cn("h-4 w-4", { "hidden": showPassword })} /></Button></div>{errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="confirmPassword">Confirme a Senha</Label><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="confirmPassword" type={showPassword ? "text" : "password"} {...register("confirmPassword")} className="pl-10 pr-10"/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)} tabIndex={-1}><EyeOff className={cn("h-4 w-4", { "hidden": !showPassword })} /><Eye className={cn("h-4 w-4", { "hidden": showPassword })} /></Button></div>{errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>}</div>
          </div>

          {passwordValue && (
              <div className="space-y-1 text-xs">
                  {passwordCheck.map(req => (
                      <div key={req.id} className={cn("flex items-center gap-2", req.met ? "text-emerald-600" : "text-muted-foreground")}>
                          <CheckCircle className="h-3 w-3"/>
                          <span>{req.text}</span>
                      </div>
                  ))}
              </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Controller name="terms" control={control} render={({ field }) => (<Checkbox id="terms" checked={field.value} onCheckedChange={field.onChange} />)} />
            <div className="grid gap-1.5 leading-none"><label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Eu aceito os{" "}<Link href="/terms" className="underline text-primary" target="_blank">Termos de Serviço</Link> e a{" "}<Link href="/policy" className="underline text-primary" target="_blank">Política de Privacidade</Link>.</label>{errors.terms && <p className="text-sm text-destructive">{errors.terms.message}</p>}</div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Criando conta..." : "Criar Conta"}
          </Button>
      </form>
      
      <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou continue com</span></div></div>
      
      <div className="space-y-2">
        <OAuthButton
          provider="google"
          buttonText="Inscrever-se com Google"
        />
        <OAuthButton
          provider="github"
          buttonText="Inscrever-se com GitHub"
        />
      </div>
    </div>
  );
}
