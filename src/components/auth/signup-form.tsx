
"use client";

import { useActionState, useEffect } from "react";
import { AlertTriangle, UserPlus, KeyRound, Mail, User as UserIcon, Smartphone, FileText, Fingerprint, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signupUser, signInWithOAuth, type SignupFormState } from "@/app/actions/auth.actions";
import { OAuthButton } from "./oauth-button";
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";

export function SignupForm() {
  const initialState: SignupFormState = { message: undefined, errors: {}, success: undefined };
  const [state, dispatch] = useActionState(signupUser, initialState);

  useEffect(() => {
    if (state?.message && !state.success) {
      if (state.errors?._form) {
        // Erro geral já tratado pela Alert
      } else {
        toast({
          title: "Erro no Cadastro",
          description: state.message,
          variant: "destructive",
        });
      }
    }
    // Sucesso no cadastro é tratado por redirecionamento para /login com parâmetro
  }, [state]);

  const handleGoogleSignIn = async () => {
    await signInWithOAuth('google');
  };

  return (
    <div className="space-y-6">
      <form action={dispatch} className="space-y-4">
        {state?.errors?._form && (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Falha ao Inscrever-se</AlertTitle>
            <AlertDescription>{state.errors._form.join(', ')}</AlertDescription>
          </Alert>
        )}
        {/* Removida a segunda Alert genérica para evitar duplicidade com toast */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="fullName" name="fullName" placeholder="Seu Nome Completo" required className="pl-10" aria-describedby="fullName-error" />
            </div>
            {state?.errors?.fullName && <p id="fullName-error" className="text-sm text-destructive">{state.errors.fullName.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="displayName" name="displayName" placeholder="Como quer ser chamado(a)" required className="pl-10" aria-describedby="displayName-error" />
            </div>
            {state?.errors?.displayName && <p id="displayName-error" className="text-sm text-destructive">{state.errors.displayName.join(', ')}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" required className="pl-10" aria-describedby="email-error" />
          </div>
          {state?.errors?.email && <p id="email-error" className="text-sm text-destructive">{state.errors.email.join(', ')}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" name="password" type="password" placeholder="••••••••" required className="pl-10" aria-describedby="password-error" />
            </div>
            {state?.errors?.password && <p id="password-error" className="text-sm text-destructive">{state.errors.password.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required className="pl-10" aria-describedby="confirmPassword-error" />
            </div>
            {state?.errors?.confirmPassword && <p id="confirmPassword-error" className="text-sm text-destructive">{state.errors.confirmPassword.join(', ')}</p>}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone (Opcional)</Label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="phone" name="phone" type="tel" placeholder="(XX) XXXXX-XXXX" className="pl-10" aria-describedby="phone-error" />
          </div>
          {state?.errors?.phone && <p id="phone-error" className="text-sm text-destructive">{state.errors.phone.join(', ')}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpfCnpj">CPF/CNPJ (Opcional)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="cpfCnpj" name="cpfCnpj" placeholder="Seu CPF ou CNPJ" className="pl-10" aria-describedby="cpfCnpj-error" />
            </div>
            {state?.errors?.cpfCnpj && <p id="cpfCnpj-error" className="text-sm text-destructive">{state.errors.cpfCnpj.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rg">RG (Opcional)</Label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="rg" name="rg" placeholder="Seu RG" className="pl-10" aria-describedby="rg-error" />
            </div>
            {state?.errors?.rg && <p id="rg-error" className="text-sm text-destructive">{state.errors.rg.join(', ')}</p>}
          </div>
        </div>

        <SubmitButton pendingText="Criando Conta...">
          Criar Conta <UserPlus className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      <Separator />
      <OAuthButton providerName="Google" Icon={LogIn} action={handleGoogleSignIn} buttonText="Inscrever-se com Google" />
    </div>
  );
}
