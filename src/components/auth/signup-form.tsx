// src/components/auth/signup-form.tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, UserPlus, KeyRound, Mail, User, Eye, EyeOff, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { OAuthButton } from "./oauth-button";

const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
  .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um caractere especial.");

const signupSchema = z.object({
  fullName: z.string().min(2, "Nome Completo é obrigatório."),
  displayName: z.string().min(2, "Nome de Exibição é obrigatório."),
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


type SignupFormData = z.infer<typeof signupSchema>;

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
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, register, watch, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur"
  });
  
  const passwordValue = watch("password", "");
  
  const passwordCheck = passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(passwordValue)
  }));


  const handleMockSignup = (data: SignupFormData) => {
    console.log("Signup Data (Simulação):", data);
    setFormError(null);
    toast({
      title: "Cadastro Simulado com Sucesso!",
      description: "Redirecionando para o painel...",
    });
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Modo de Demonstração</AlertTitle>
        <AlertDescription>A autenticação está desativada. O envio do formulário apenas simulará um cadastro bem-sucedido.</AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(handleMockSignup)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="fullName">Nome Completo</Label><Input id="fullName" {...register("fullName")} />{errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="displayName">Nome de Exibição</Label><Input id="displayName" {...register("displayName")} />{errors.displayName && <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>}</div>
        </div>
        
        <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="email" type="email" {...register("email")} className="pl-10"/></div>{errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input id="password" type={showPassword ? "text" : "password"} {...register("password")} className="pl-10 pr-10"/>
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirme a Senha</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input id="confirmPassword" type={showPassword ? "text" : "password"} {...register("confirmPassword")} className="pl-10 pr-10"/>
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>}
          </div>
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
          <Controller name="terms" control={control} render={({ field }) => (
              <Checkbox id="terms" checked={field.value} onCheckedChange={field.onChange} />
          )} />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Eu aceito os{" "}
              <Link href="/terms" className="underline text-primary" target="_blank">Termos de Serviço</Link> e a{" "}
              <Link href="/policy" className="underline text-primary" target="_blank">Política de Privacidade</Link>.
            </label>
            {errors.terms && <p className="text-sm text-destructive">{errors.terms.message}</p>}
          </div>
        </div>

        {formError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Erro no Cadastro</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}

        <Button type="submit" className="w-full">
          Criar Conta (Simulado) <UserPlus className="ml-2 h-4 w-4" />
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
