
"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { AlertTriangle, UserPlus, KeyRound, Mail, User as UserIcon, Building, Fingerprint, LogIn, Phone as PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signupUser, signInWithOAuth, type SignupFormState } from "@/app/actions/auth.actions";
import { OAuthButton } from "./oauth-button";
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; 
import { cn } from "@/lib/utils";

// Helper functions for masking
const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  let formatted = digits.slice(0, 11); // Max 11 digits for CPF
  if (formatted.length > 9) {
    formatted = `${formatted.slice(0, 9)}-${formatted.slice(9)}`;
  }
  if (formatted.length > 6) {
    formatted = `${formatted.slice(0, 6)}.${formatted.slice(6)}`;
  }
  if (formatted.length > 3) {
    formatted = `${formatted.slice(0, 3)}.${formatted.slice(3)}`;
  }
  return formatted;
};

const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  let formatted = digits.slice(0, 14); // Max 14 digits for CNPJ
  if (formatted.length > 12) {
    formatted = `${formatted.slice(0, 12)}-${formatted.slice(12)}`;
  }
  if (formatted.length > 8) {
    formatted = `${formatted.slice(0, 8)}/${formatted.slice(8)}`;
  }
  if (formatted.length > 5) {
    formatted = `${formatted.slice(0, 5)}.${formatted.slice(5)}`;
  }
  if (formatted.length > 2) {
    formatted = `${formatted.slice(0, 2)}.${formatted.slice(2)}`;
  }
  return formatted;
};

const formatRG = (value: string): string => {
  // RG formats vary a lot, this is a very generic numeric-only formatter for simplicity
  // It just allows digits and keeps it to a certain length.
  // A more robust RG mask would be very complex.
  const digits = value.replace(/\D/g, '');
  return digits.slice(0, 9); // Example: limit to 9 digits
};


export function SignupForm() {
  const initialState: SignupFormState = { message: undefined, errors: {}, success: undefined };
  const [state, dispatch] = useActionState(signupUser, initialState);
  const [accountType, setAccountType] = useState<'pessoa' | 'empresa'>('pessoa');
  const [phoneValue, setPhoneValue] = useState<string | undefined>();
  
  const [cpfValue, setCpfValue] = useState('');
  const [rgValue, setRgValue] = useState('');
  const [cnpjValue, setCnpjValue] = useState('');


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

  const handleCpfChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCpfValue(formatCPF(e.target.value));
  };

  const handleRgChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRgValue(formatRG(e.target.value));
  };

  const handleCnpjChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCnpjValue(formatCNPJ(e.target.value));
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

        <div className="space-y-2">
          <Label>Tipo de Conta</Label>
          <RadioGroup
            name="accountType"
            defaultValue="pessoa"
            onValueChange={(value: 'pessoa' | 'empresa') => {
              setAccountType(value);
              // Limpar campos ao trocar de tipo para evitar envio de dados irrelevantes
              setCpfValue('');
              setRgValue('');
              setCnpjValue('');
            }}
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
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            )}
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
                <Input
                  id="cpf"
                  name="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfValue}
                  onChange={handleCpfChange}
                  maxLength={14} // Max length for XXX.XXX.XXX-XX
                  required
                  className="pl-10"
                  aria-describedby="cpf-error"
                />
              </div>
              {state?.errors?.cpf && <p id="cpf-error" className="text-sm text-destructive">{state.errors.cpf.join(', ')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rg">RG (Opcional)</Label>
               <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  id="rg"
                  name="rg"
                  type="text"
                  placeholder="000000000"
                  value={rgValue}
                  onChange={handleRgChange}
                  maxLength={9} // Max length for XXXXXXXXX
                  className="pl-10"
                  aria-describedby="rg-error"
                />
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
              <Input
                id="cnpj"
                name="cnpj"
                type="text"
                placeholder="00.000.000/0000-00"
                value={cnpjValue}
                onChange={handleCnpjChange}
                maxLength={18} // Max length for XX.XXX.XXX/XXXX-XX
                required
                className="pl-10"
                aria-describedby="cnpj-error"
              />
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
        .PhoneInput {
          display: flex;
          align-items: center;
        }
        .PhoneInputInput {
          border: none !important;
          box-shadow: none !important;
          padding-left: 0.5rem !important; 
          margin-left: 0.25rem !important;
          background-color: transparent; /* Ensure background is transparent */
          outline: none; /* Ensure no outline from the library */
          flex: 1; /* Allow it to take available space */
          font-size: inherit; /* Inherit font size */
          line-height: inherit; /* Inherit line height */
        }
        .PhoneInputCountrySelect {
          margin-right: 0.25rem !important;
        }
        .PhoneInputCountryIcon {
            box-shadow: none !important;
        }
        .PhoneInputCountryIcon--border {
            box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
