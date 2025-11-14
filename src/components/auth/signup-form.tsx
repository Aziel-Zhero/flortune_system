// src/components/auth/signup-form.tsx
"use client";

import { useState, useTransition } from "react";
import React from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, KeyRound, Mail, User, Eye, EyeOff, CheckCircle, Building, FileText, Fingerprint, Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { OAuthButton } from "./oauth-button";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
  .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um caractere especial.");

const signupFormSchema = z.object({
  fullName: z.string().min(2, "Nome Completo ou Razão Social é obrigatório."),
  displayName: z.string().min(2, "Nome de Exibição ou Fantasia é obrigatório."),
  email: z.string().email("Email inválido."),
  password: passwordSchema,
  confirmPassword: z.string(),
  accountType: z.enum(['pessoa', 'empresa'], { required_error: "Selecione o tipo de conta."}),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  rg: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos e condições."
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
}).refine(data => {
    if (data.accountType === 'pessoa' && !data.cpf) return false;
    return true;
}, { message: "CPF é obrigatório para pessoa física.", path: ["cpf"]})
.refine(data => {
    if (data.accountType === 'empresa' && !data.cnpj) return false;
    return true;
}, { message: "CNPJ é obrigatório para empresa.", path: ["cnpj"]});

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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, register, watch, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    mode: "onBlur",
    defaultValues: {
        accountType: 'pessoa'
    }
  });
  
  const passwordValue = watch("password", "");
  const accountType = watch("accountType");

  const passwordCheck = passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(passwordValue)
  }));
  
  const processSignup: SubmitHandler<SignupFormData> = async (data) => {
    setIsSubmitting(true);

    if (!supabase) {
      toast({ title: "Erro de Configuração", description: "O serviço de autenticação não está disponível.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback`,
        data: {
          full_name: data.fullName,
          display_name: data.displayName,
          account_type: data.accountType,
          cpf_cnpj: data.accountType === 'pessoa' ? data.cpf : data.cnpj,
          rg: data.rg,
        },
      },
    });

    if (error) {
       toast({
        title: "Erro no Cadastro",
        description: error.message.includes("User already registered") ? "Este e-mail já está cadastrado. Tente fazer login." : (error.message || "Ocorreu um erro ao criar a conta."),
        variant: "destructive",
      });
    } else {
       toast({
        title: "Cadastro quase concluído!",
        description: "Enviamos um e-mail de confirmação para você. Por favor, verifique sua caixa de entrada.",
      });
      router.push('/login?signup=success');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(processSignup)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Conta</Label>
            <Controller
                name="accountType"
                control={control}
                render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="pessoa" id="pessoa" /><Label htmlFor="pessoa" className="font-normal flex items-center gap-1.5"><User className="h-4 w-4"/>Pessoa Física</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="empresa" id="empresa" /><Label htmlFor="empresa" className="font-normal flex items-center gap-1.5"><Building className="h-4 w-4"/>Empresa</Label></div>
                </RadioGroup>
                )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="fullName">{accountType === 'pessoa' ? 'Nome Completo' : 'Razão Social'}</Label><Input id="fullName" {...register("fullName")} />{errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="displayName">{accountType === 'pessoa' ? 'Nome de Exibição' : 'Nome Fantasia'}</Label><Input id="displayName" {...register("displayName")} />{errors.displayName && <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>}</div>
          </div>
          
          <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="email" type="email" {...register("email")} className="pl-10"/></div>{errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}</div>
        
          {accountType === 'pessoa' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="cpf" {...register("cpf")} className="pl-10"/></div>{errors.cpf && <p className="text-sm text-destructive mt-1">{errors.cpf.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="rg">RG (Opcional)</Label><div className="relative"><Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="rg" {...register("rg")} className="pl-10"/></div></div>
              </div>
          ) : (
              <div className="space-y-2"><Label htmlFor="cnpj">CNPJ</Label><div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="cnpj" {...register("cnpj")} className="pl-10"/></div>{errors.cnpj && <p className="text-sm text-destructive mt-1">{errors.cnpj.message}</p>}</div>
          )}


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
      
      <OAuthButton
        provider="google"
        buttonText="Inscrever-se com Google"
      />
    </div>
  );
}
