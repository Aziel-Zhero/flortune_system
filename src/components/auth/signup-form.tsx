
"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, UserPlus, KeyRound, Mail, User as UserIcon, Building, Fingerprint, LogIn, Phone as PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep for unmasked inputs
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signupUser, signInWithOAuth, type SignupFormState } from "@/app/actions/auth.actions";
import { OAuthButton } from "./oauth-button";
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";
import InputMask from "react-input-mask";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Estilos para o componente de telefone
import { cn } from "@/lib/utils";


export function SignupForm() {
  const initialState: SignupFormState = { message: undefined, errors: {}, success: undefined };
  const [state, dispatch] = useActionState(signupUser, initialState);
  const [accountType, setAccountType] = useState<'pessoa' | 'empresa'>('pessoa');
  const [phoneValue, setPhoneValue] = useState<string | undefined>();


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
  
  const fullNameLabel = accountType === 'pessoa' ? "Nome Completo" : "Razão Social";
  const displayNameLabel = accountType === 'pessoa' ? "Nome de Exibição" : "Nome Fantasia";

  const shadcnInputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

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

        <div className="space-y-2">
          <Label>Tipo de Conta</Label>
          <RadioGroup
            name="accountType"
            defaultValue="pessoa"
            onValueChange={(value: 'pessoa' | 'empresa') => setAccountType(value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pessoa" id="r1" />
              <Label htmlFor="r1" className="font-normal">Pessoa Física</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="empresa" id="r2" />
              <Label htmlFor="r2" className="font-normal">Pessoa Jurídica</Label>
            </div>
          </RadioGroup>
          {state?.errors?.accountType && <p className="text-sm text-destructive">{state.errors.accountType.join(', ')}</p>}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{fullNameLabel}</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="fullName" name="fullName" placeholder={accountType === 'pessoa' ? "Seu Nome Completo" : "Razão Social da Empresa"} required className="pl-10" aria-describedby="fullName-error" />
            </div>
            {state?.errors?.fullName && <p id="fullName-error" className="text-sm text-destructive">{state.errors.fullName.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">{displayNameLabel}</Label>
            <div className="relative">
              {accountType === 'pessoa' ? (
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              ) : (
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input id="displayName" name="displayName" placeholder={accountType === 'pessoa' ? "Como quer ser chamado(a)" : "Nome Fantasia da Empresa"} required className="pl-10" aria-describedby="displayName-error" />
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
          <PhoneInput
            id="phone"
            name="phone"
            placeholder="Seu número de telefone"
            value={phoneValue}
            onChange={setPhoneValue}
            defaultCountry="BR"
            international
            countryCallingCodeEditable={false}
            className={cn(shadcnInputClasses, "text-base md:text-sm")}
            aria-describedby="phone-error"
          />
          {state?.errors?.phone && <p id="phone-error" className="text-sm text-destructive">{state.errors.phone.join(', ')}</p>}
        </div>
        

        {accountType === 'pessoa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <InputMask
                  mask="999.999.999-99"
                  name="cpf"
                  disabled={accountType !== 'pessoa'}
                  value={undefined} // Control value via form data or state if needed
                  // onChange={...} // If you need controlled input
                >
                  {(inputProps: any) => (
                    <input
                      {...inputProps}
                      id="cpf"
                      placeholder="000.000.000-00"
                      required={accountType === 'pessoa'}
                      className={cn(shadcnInputClasses, "pl-10")}
                      aria-describedby="cpf-error"
                    />
                  )}
                </InputMask>
              </div>
              {state?.errors?.cpf && <p id="cpf-error" className="text-sm text-destructive">{state.errors.cpf.join(', ')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rg">RG (Opcional)</Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <InputMask
                  mask="99.999.999-9"
                  name="rg"
                  disabled={accountType !== 'pessoa'}
                  value={undefined}
                >
                  {(inputProps: any) => (
                    <input
                      {...inputProps}
                      id="rg"
                      placeholder="00.000.000-0"
                      className={cn(shadcnInputClasses, "pl-10")}
                      aria-describedby="rg-error"
                    />
                  )}
                </InputMask>
              </div>
              {state?.errors?.rg && <p id="rg-error" className="text-sm text-destructive">{state.errors.rg.join(', ')}</p>}
            </div>
          </div>
        )}

        {accountType === 'empresa' && (
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <InputMask
                mask="99.999.999/9999-99"
                name="cnpj"
                disabled={accountType !== 'empresa'}
                value={undefined}
              >
                {(inputProps: any) => (
                  <input
                    {...inputProps}
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    required={accountType === 'empresa'}
                    className={cn(shadcnInputClasses, "pl-10")}
                    aria-describedby="cnpj-error"
                  />
                )}
              </InputMask>
            </div>
            {state?.errors?.cnpj && <p id="cnpj-error" className="text-sm text-destructive">{state.errors.cnpj.join(', ')}</p>}
          </div>
        )}


        <SubmitButton pendingText="Criando Conta...">
          Criar Conta <UserPlus className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      <Separator />
      <OAuthButton providerName="Google" Icon={LogIn} action={handleGoogleSignIn} buttonText="Inscrever-se com Google" />
      
      <style jsx global>{`
        .PhoneInputInput {
          border: none !important;
          box-shadow: none !important;
          padding-left: 0.5rem !important; /* Adjust as needed */
          margin-left: 0.25rem !important; /* Adjust as needed */
          background-color: transparent;
          outline: none;
          flex: 1;
          /* Inherit text size from parent */
          font-size: inherit; 
          line-height: inherit;
        }
        .PhoneInputCountrySelect {
          margin-right: 0.25rem !important;
        }
        .PhoneInputCountryIcon {
            box-shadow: none !important;
        }
        .PhoneInputCountryIcon--border {
            box-shadow: none !important; /* Override default shadow if any */
        }
      `}</style>
    </div>
  );
}
