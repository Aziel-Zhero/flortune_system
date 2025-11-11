// src/components/auth/signup-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { AlertTriangle, UserPlus, KeyRound, Mail, User, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { OAuthButton } from "./oauth-button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signupUser, type SignupFormState } from "@/app/actions/auth.actions";
import { toast } from "@/hooks/use-toast";


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
  accountType: z.enum(['pessoa', 'empresa'], { required_error: "Selecione o tipo de conta." }),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  rg: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos e condições."
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
})
.refine(data => data.accountType === 'empresa' ? !!data.cnpj && data.cnpj.replace(/\D/g, '').length === 14 : true, {
  message: "CNPJ é obrigatório para pessoa jurídica.",
  path: ["cnpj"],
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
  const [formState, formAction] = useActionState(signupUser, { message: "", success: false });

  const { control, register, watch, formState: { errors } } = useForm<SignupFormData>({
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
  
  useEffect(() => {
    if (formState?.message && !formState.success) {
      toast({
        title: "Erro no Cadastro",
        description: formState.message,
        variant: "destructive",
      });
    }
  }, [formState]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Conta</Label>
            <Controller
                name="accountType"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="pessoa" id="pessoa" /><Label htmlFor="pessoa" className="font-normal">Pessoa Física</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="empresa" id="empresa" /><Label htmlFor="empresa" className="font-normal">Pessoa Jurídica</Label></div>
                  </RadioGroup>
                )}
              />
              {errors.accountType && <p className="text-sm text-destructive mt-1">{errors.accountType.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="fullName">{accountType === 'pessoa' ? 'Nome Completo' : 'Razão Social'}</Label><Input id="fullName" {...register("fullName")} />{errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="displayName">{accountType === 'pessoa' ? 'Nome de Exibição' : 'Nome Fantasia'}</Label><Input id="displayName" {...register("displayName")} />{errors.displayName && <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>}</div>
          </div>
          
          <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="email" type="email" {...register("email")} className="pl-10"/></div>{(errors.email || formState?.errors?.email) && <p className="text-sm text-destructive mt-1">{errors.email?.message || formState?.errors?.email?.[0]}</p>}</div>
        
          {accountType === 'pessoa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><Input id="cpf" {...register("cpf")} />{errors.cpf && <p className="text-sm text-destructive mt-1">{errors.cpf.message}</p>}</div>
               <div className="space-y-2"><Label htmlFor="rg">RG (Opcional)</Label><Input id="rg" {...register("rg")} /></div>
            </div>
          )}
           {accountType === 'empresa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2"><Label htmlFor="cnpj">CNPJ</Label><Input id="cnpj" {...register("cnpj")} />{errors.cnpj && <p className="text-sm text-destructive mt-1">{errors.cnpj.message}</p>}</div>
               <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" type="tel" {...register("phone")} />{errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}</div>
            </div>
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

          <Button type="submit" className="w-full">
            Criar Conta <UserPlus className="ml-2 h-4 w-4" />
          </Button>
      </form>
      
      <Separator />
      
      <OAuthButton
        providerName="Google"
        buttonText="Inscrever-se com Google"
      />
    </div>
  );
}
