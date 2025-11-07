// src/components/auth/signup-form.tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, UserPlus, KeyRound, Mail, Building, User, Phone, FileText, Fingerprint, Eye, EyeOff, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.22c-.46 2.07-2.13 3.42-4.09 3.42a5.34 5.34 0 0 1-5.34-5.34a5.34 5.34 0 0 1 5.34-5.34c1.41 0 2.42.52 3.2 1.26l1.96-1.96A8.74 8.74 0 0 0 12.18 2a9.34 9.34 0 0 0-9.34 9.34a9.34 9.34 0 0 0 9.34 9.34c5.04 0 8.92-3.76 8.92-8.92c0-.61-.05-1.11-.15-1.56Z"/>
  </svg>
);

const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
  .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um caractere especial.");

const signupSchema = z.object({
  accountType: z.enum(['pessoa', 'empresa'], { required_error: "Selecione o tipo de conta." }),
  fullName: z.string().min(2, "Nome/Razão Social é obrigatório."),
  displayName: z.string().min(2, "Nome de Exibição/Fantasia é obrigatório."),
  email: z.string().email("Email inválido."),
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos e condições."
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
}).refine(data => {
    if (data.accountType === 'empresa') {
      return !!data.cnpj && data.cnpj.replace(/\D/g, '').length === 14;
    }
    return true;
}, {
    message: "CNPJ é obrigatório e deve ser válido (14 dígitos) para pessoa jurídica.",
    path: ["cnpj"],
})
.refine(data => {
    if (data.accountType === 'empresa') {
        return !!data.phone && data.phone.trim() !== '' && data.phone.replace(/\D/g, '').length >= 10;
    }
    return true;
}, {
    message: "Telefone é obrigatório e deve ser válido para pessoa jurídica.",
    path: ["phone"],
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
    defaultValues: { accountType: 'pessoa' },
    mode: "onBlur"
  });
  
  const accountType = watch("accountType");
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

  const handleGoogleSignIn = () => {
    toast({
      title: "Cadastro com Google (Desativado)",
      description: "A autenticação está desativada. Redirecionando para o painel.",
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
        <div className="space-y-2">
          <Label>Tipo de Conta</Label>
          <Controller
            name="accountType"
            control={control}
            render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="pessoa" id="pessoa" /><Label htmlFor="pessoa" className="font-normal flex items-center gap-2"><User className="h-4 w-4"/>Pessoa Física</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="empresa" id="empresa" /><Label htmlFor="empresa" className="font-normal flex items-center gap-2"><Building className="h-4 w-4"/>Empresa</Label></div>
              </RadioGroup>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="fullName">{accountType === 'pessoa' ? 'Nome Completo' : 'Razão Social'}</Label><Input id="fullName" {...register("fullName")} />{errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="displayName">{accountType === 'pessoa' ? 'Nome de Exibição' : 'Nome Fantasia'}</Label><Input id="displayName" {...register("displayName")} />{errors.displayName && <p className="text-sm text-destructive mt-1">{errors.displayName.message}</p>}</div>
        </div>
        
        {accountType === 'empresa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="cnpj">CNPJ</Label><div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="cnpj" {...register("cnpj")} className="pl-10"/></div>{errors.cnpj && <p className="text-sm text-destructive mt-1">{errors.cnpj.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="phone" {...register("phone")} className="pl-10"/></div>{errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}</div>
          </div>
        )}
        
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
              <Link href="#" className="underline text-primary">Termos de Serviço</Link> e a{" "}
              <Link href="#" className="underline text-primary">Política de Privacidade</Link>.
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
      
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <GoogleIcon /> Inscrever-se com Google (Simulado)
      </Button>
    </div>
  );
}
