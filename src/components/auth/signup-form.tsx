// src/components/auth/signup-form.tsx
"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { UserPlus, KeyRound, Mail, User, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { OAuthButton } from "./oauth-button";
import { signupUser, type SignupFormState } from "@/app/actions/auth.actions";
import { toast } from "@/hooks/use-toast";
import { SubmitButton } from "./submit-button";


const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
  .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um caractere especial.");

const signupFormSchema = z.object({
  fullName: z.string().min(2, "Nome Completo é obrigatório."),
  displayName: z.string().min(2, "Nome de Exibição é obrigatório."),
  email: z.string().email("Email inválido."),
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
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
  const [showPassword, setShowPassword] = useState(false);
  const initialState: SignupFormState = { message: "", success: false };
  const [state, formAction] = useFormState(signupUser, initialState);

  const { control, register, watch, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    mode: "onBlur",
  });

  const passwordValue = watch("password", "");

  const passwordCheck = passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(passwordValue)
  }));
  
  useEffect(() => {
    if (state?.message && !state.success) {
      toast({
        title: "Erro no Cadastro",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="fullName">Nome Completo</Label><Input id="fullName" {...register("fullName")} />{(errors.fullName || state?.errors?.fullName) && <p className="text-sm text-destructive mt-1">{errors.fullName?.message || state.errors?.fullName?.[0]}</p>}</div>
              <div className="space-y-2"><Label htmlFor="displayName">Nome de Exibição</Label><Input id="displayName" {...register("displayName")} />{(errors.displayName || state?.errors?.displayName) && <p className="text-sm text-destructive mt-1">{errors.displayName?.message || state.errors?.displayName?.[0]}</p>}</div>
          </div>
          
          <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="email" type="email" {...register("email")} className="pl-10"/></div>{(errors.email || state?.errors?.email) && <p className="text-sm text-destructive mt-1">{errors.email?.message || state?.errors?.email?.[0]}</p>}</div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="password">Senha</Label><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="password" type={showPassword ? "text" : "password"} {...register("password")} className="pl-10 pr-10"/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)}><EyeOff className={cn("h-4 w-4", { "hidden": !showPassword })} /><Eye className={cn("h-4 w-4", { "hidden": showPassword })} /></Button></div>{(errors.password || state?.errors?.password) && <p className="text-sm text-destructive mt-1">{errors.password?.message || state.errors?.password?.[0]}</p>}</div>
            <div className="space-y-2"><Label htmlFor="confirmPassword">Confirme a Senha</Label><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="confirmPassword" type={showPassword ? "text" : "password"} {...register("confirmPassword")} className="pl-10 pr-10"/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)} tabIndex={-1}><EyeOff className={cn("h-4 w-4", { "hidden": !showPassword })} /><Eye className={cn("h-4 w-4", { "hidden": showPassword })} /></Button></div>{(errors.confirmPassword || state?.errors?.confirmPassword) && <p className="text-sm text-destructive mt-1">{errors.confirmPassword?.message || state.errors?.confirmPassword?.[0]}</p>}</div>
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
            <div className="grid gap-1.5 leading-none"><label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Eu aceito os{" "}<Link href="/terms" className="underline text-primary" target="_blank">Termos de Serviço</Link> e a{" "}<Link href="/policy" className="underline text-primary" target="_blank">Política de Privacidade</Link>.</label>{(errors.terms || state?.errors?.terms) && <p className="text-sm text-destructive">{errors.terms?.message || state.errors?.terms?.[0]}</p>}</div>
          </div>

          <SubmitButton pendingText="Criando conta...">
            Criar Conta <UserPlus className="ml-2 h-4 w-4" />
          </SubmitButton>
      </form>
      
      <Separator />
      
      <OAuthButton
        providerName="Google"
        buttonText="Inscrever-se com Google"
      />
    </div>
  );
}
