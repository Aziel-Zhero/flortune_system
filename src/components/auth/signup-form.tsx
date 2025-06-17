
"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, UserPlus, KeyRound, Mail, User as UserIcon, Building, Fingerprint, Phone as PhoneIcon, Eye, EyeOff } from "lucide-react";
// import { Button } from "@/components/ui/button"; // Usaremos SubmitButton
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signupUser, type SignupFormState } from "@/app/actions/auth.actions"; // Action atualizada
// import { OAuthButton } from "./oauth-button"; // Google removido temporariamente
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
// import { signIn } from "next-auth/react"; // Para Google Sign In futuro

const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  let formatted = digits.slice(0, 11);
  if (formatted.length > 9) formatted = `${formatted.slice(0, 9)}-${formatted.slice(9)}`;
  if (formatted.length > 6) formatted = `${formatted.slice(0, 6)}.${formatted.slice(6)}`;
  if (formatted.length > 3) formatted = `${formatted.slice(0, 3)}.${formatted.slice(3)}`;
  return formatted;
};

const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  let formatted = digits.slice(0, 14);
  if (formatted.length > 12) formatted = `${formatted.slice(0, 12)}-${formatted.slice(12)}`;
  if (formatted.length > 8) formatted = `${formatted.slice(0, 8)}/${formatted.slice(8)}`;
  if (formatted.length > 5) formatted = `${formatted.slice(0, 5)}.${formatted.slice(5)}`;
  if (formatted.length > 2) formatted = `${formatted.slice(0, 2)}.${formatted.slice(2)}`;
  return formatted;
};

const formatRG = (value: string): string => {
  const cleaned = value.replace(/[^0-9Xx]/g, '').toUpperCase();
  let formatted = cleaned.slice(0, 9);
  if (formatted.length > 8) {
    const lastChar = formatted.slice(8);
    if (!/^[0-9X]$/.test(lastChar)) formatted = formatted.slice(0,8);
  }
  if (formatted.length > 6) formatted = `${formatted.slice(0, 6)}-${formatted.slice(6)}`;
  if (formatted.length > 3) formatted = `${formatted.slice(0, 3)}.${formatted.slice(3)}`;
  if (formatted.length > 2) formatted = `${formatted.slice(0, 2)}.${formatted.slice(2)}`;
  return formatted.slice(0, 12);
};

export function SignupForm() {
  const initialState: SignupFormState = { message: undefined, errors: {}, success: undefined };
  const [state, dispatch] = useActionState(signupUser, initialState);
  const [accountType, setAccountType] = useState<'pessoa' | 'empresa'>('pessoa');
  const [phoneValue, setPhoneValue] = useState<string | undefined>();
  const [cpfValue, setCpfValue] = useState('');
  const [rgValue, setRgValue] = useState('');
  const [cnpjValue, setCnpjValue] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "Muito Fraca", color: "bg-destructive" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (state?.message && !state.success && !state.errors?._form) { // Mostra toast se não for erro _form (já na Alert)
        toast({
          title: "Erro no Cadastro",
          description: state.message,
          variant: "destructive",
        });
    }
    if (state?.success && state.message) { // Para mensagem de sucesso se houver (embora redirect seja mais comum)
        toast({
            title: "Sucesso!",
            description: state.message,
        });
    }
  }, [state]);

  useEffect(() => {
    if (password && confirmPassword) setPasswordsMatch(password === confirmPassword);
    else setPasswordsMatch(null);
  }, [password, confirmPassword]);

  useEffect(() => {
    let score = 0;
    let label = "Muito Fraca";
    let color = "bg-destructive";
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    if (score <= 1 && password.length > 0) { label = "Fraca"; color = "bg-red-500"; }
    else if (score === 2) { label = "Média"; color = "bg-yellow-500"; }
    else if (score === 3) { label = "Forte"; color = "bg-green-500"; }
    else if (score >= 4) { label = "Muito Forte"; color = "bg-emerald-500"; }
    else if (password.length === 0) { label = "Muito Fraca"; color = "bg-destructive"; score = 0; }
    setPasswordStrength({ score: (score/4)*100, label, color });
  }, [password]);

  const fullNameLabel = accountType === 'pessoa' ? "Nome Completo" : "Razão Social";
  const displayNameLabel = accountType === 'pessoa' ? "Nome de Exibição" : "Nome Fantasia";
  const phoneLabel = accountType === 'empresa' ? "Telefone (Obrigatório)" : "Telefone (Opcional)";

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
        {state?.message && !state.success && !state.errors?._form && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
            </Alert>
        )}

        <div className="space-y-2">
          <Label>Tipo de Conta</Label>
          <RadioGroup
            name="accountType"
            defaultValue="pessoa"
            onValueChange={(value: 'pessoa' | 'empresa') => {
              setAccountType(value);
              setCpfValue(''); setRgValue(''); setCnpjValue(''); setPhoneValue(undefined);
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
              {accountType === 'pessoa' ? <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> : <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
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
              <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required className="pl-10 pr-10" aria-describedby="password-error" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-1 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            {state?.errors?.password && <p id="password-error" className="text-sm text-destructive">{state.errors.password.join(', ')}</p>}
            {password.length > 0 && (<div className="mt-1"><Progress value={passwordStrength.score} className={cn("h-2 w-full", passwordStrength.color)} indicatorClassName={cn(passwordStrength.color)} /><p className="text-xs mt-1 text-muted-foreground">Força da senha: {passwordStrength.label}</p></div>)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" required className="pl-10 pr-10" aria-describedby="confirmPassword-error" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="button" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-1 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            {state?.errors?.confirmPassword && <p id="confirmPassword-error" className="text-sm text-destructive">{state.errors.confirmPassword.join(', ')}</p>}
            {passwordsMatch === false && <p className="text-sm text-destructive mt-1">As senhas não coincidem.</p>}
            {passwordsMatch === true && <p className="text-sm text-emerald-600 mt-1">As senhas coincidem.</p>}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">{phoneLabel}</Label>
           <PhoneInput id="phone" name="phone" placeholder="Seu número de telefone" value={phoneValue} onChange={setPhoneValue} defaultCountry="BR" international countryCallingCodeEditable={false} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm")} aria-describedby="phone-error" required={accountType === 'empresa'} />
          {state?.errors?.phone && <p id="phone-error" className="text-sm text-destructive">{state.errors.phone.join(', ')}</p>}
          {phoneValue && !isValidPhoneNumber(phoneValue) && (<p className="text-sm text-destructive mt-1">Número de telefone inválido.</p>)}
        </div>
        
        {accountType === 'pessoa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (Opcional)</Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input id="cpf" name="cpf" type="text" placeholder="000.000.000-00" value={cpfValue} onChange={(e) => setCpfValue(formatCPF(e.target.value))} maxLength={14} className="pl-10" aria-describedby="cpf-error" />
              </div>
              {state?.errors?.cpf && <p id="cpf-error" className="text-sm text-destructive">{state.errors.cpf.join(', ')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rg">RG (Opcional)</Label>
               <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input id="rg" name="rg" type="text" placeholder="00.000.000-X" value={rgValue} onChange={(e) => setRgValue(formatRG(e.target.value))} maxLength={12} className="pl-10" aria-describedby="rg-error" />
              </div>
              {state?.errors?.rg && <p id="rg-error" className="text-sm text-destructive">{state.errors.rg.join(', ')}</p>}
            </div>
          </div>
        )}

        {accountType === 'empresa' && (
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ (Obrigatório)</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <Input id="cnpj" name="cnpj" type="text" placeholder="00.000.000/0000-00" value={cnpjValue} onChange={(e) => setCnpjValue(formatCNPJ(e.target.value))} maxLength={18} required className="pl-10" aria-describedby="cnpj-error" />
            </div>
            {state?.errors?.cnpj && <p id="cnpj-error" className="text-sm text-destructive">{state.errors.cnpj.join(', ')}</p>}
          </div>
        )}

        <SubmitButton pendingText="Criando Conta...">
          Criar Conta <UserPlus className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      
      {/* Google Sign-In com NextAuth será adicionado aqui quando o provider for configurado em auth.ts */}
      {/* {accountType === 'pessoa' && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={async () => await signIn('google', { callbackUrl: '/dashboard' })} disabled={true}> Inscrever-se com Google (Em Breve)</Button>
        </>
      )} */}
      <p className="text-center text-sm text-muted-foreground">
        Login com Google temporariamente desabilitado.
      </p>
      
      <style jsx global>{`
        .PhoneInput { display: flex; align-items: center; }
        .PhoneInputInput { border: none !important; box-shadow: none !important; padding-left: 0.5rem !important; margin-left: 0.25rem !important; background-color: transparent; outline: none; flex: 1; font-size: inherit; line-height: inherit; }
        .PhoneInputCountrySelect { margin-right: 0.25rem !important; }
        .PhoneInputCountryIcon { box-shadow: none !important; }
        .PhoneInputCountryIcon--border { box-shadow: none !important; }
      `}</style>
    </div>
  );
}
