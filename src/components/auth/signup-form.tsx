
"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, UserPlus, KeyRound, Mail, User as UserIcon, Building, Fingerprint, Phone as PhoneIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signupUser, type SignupFormState } from "@/app/actions/auth.actions"; 
import { SubmitButton } from "./submit-button";
import { toast } from "@/hooks/use-toast";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { signIn } from "next-auth/react"; 
import { useSearchParams, useRouter } from 'next/navigation';

// Placeholder Google icon as SVG component
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.22c-.46 2.07-2.13 3.42-4.09 3.42a5.34 5.34 0 0 1-5.34-5.34a5.34 5.34 0 0 1 5.34-5.34c1.41 0 2.42.52 3.2 1.26l1.96-1.96A8.74 8.74 0 0 0 12.18 2a9.34 9.34 0 0 0-9.34 9.34a9.34 9.34 0 0 0 9.34 9.34c5.04 0 8.92-3.76 8.92-8.92c0-.61-.05-1.11-.15-1.56Z"/>
  </svg>
);

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
  let formatted = cleaned.slice(0, 9); // Limite típico, mas RGs variam
  // Exemplo simples de formatação, pode precisar de ajustes para diferentes estados
  if (formatted.length > 2 && formatted.length <= 9) { // XX.XXX.XXX-X
    formatted = formatted.replace(/(\d{2})(\d{3})(\d{3})([0-9Xx])$/, '$1.$2.$3-$4');
  }
  return formatted.slice(0, 12); // Max length 12 incluindo pontos e traço
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (state?.message && !state.success && !state.errors?._form) { 
        toast({
          title: "Erro no Cadastro",
          description: state.message,
          variant: "destructive",
        });
        setFormError(state.message); // Também definir como erro de formulário para exibição
    } else if (state?.errors?._form) {
        setFormError(state.errors._form.join(', '));
    } else {
        setFormError(null); // Limpar erro se não houver mais
    }
    // O redirecionamento é tratado pela action agora.
    // if (state?.success && state.message) { 
    //     toast({
    //         title: "Sucesso!",
    //         description: state.message,
    //     });
    // }
  }, [state]);

  useEffect(() => {
    if (password && confirmPassword) setPasswordsMatch(password === confirmPassword);
    else setPasswordsMatch(null);
  }, [password, confirmPassword]);

  useEffect(() => {
    let score = 0;
    let calculatedLabel = "Muito Fraca"; // Renomeado para evitar conflito de escopo
    let calculatedColor = "bg-destructive"; // Renomeado para evitar conflito de escopo
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    if (score <= 1 && password.length > 0) { calculatedLabel = "Fraca"; calculatedColor = "bg-red-500"; }
    else if (score === 2) { calculatedLabel = "Média"; calculatedColor = "bg-yellow-500"; }
    else if (score === 3) { calculatedLabel = "Forte"; calculatedColor = "bg-green-500"; }
    else if (score >= 4) { calculatedLabel = "Muito Forte"; calculatedColor = "bg-emerald-500"; }
    else if (password.length === 0) { calculatedLabel = "Muito Fraca"; calculatedColor = "bg-destructive"; score = 0; }
    setPasswordStrength({ score: (score/4)*100, label: calculatedLabel, color: calculatedColor });
  }, [password]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFormError(null); // Limpar erros de formulário
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      await signIn('google', { callbackUrl, redirect: false });
      // Se signIn com redirect: false for bem-sucedido e o usuário for novo, 
      // o adapter e o trigger do BD devem criar o usuário.
      // O NextAuth tipicamente redireciona para a página de erro se algo falhar no OAuth.
      // Se a intenção é sempre ir para o dashboard: signIn('google', { callbackUrl: '/dashboard' });
    } catch(e) {
       console.error("SignupForm: Exception during signIn (Google):", e);
       setFormError("Falha ao iniciar cadastro com Google.");
       toast({ title: "Erro com Google", description: "Não foi possível iniciar o cadastro com Google.", variant: "destructive" });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const fullNameLabel = accountType === 'pessoa' ? "Nome Completo" : "Razão Social";
  const displayNameLabel = accountType === 'pessoa' ? "Nome de Exibição" : "Nome Fantasia";
  const phoneLabel = accountType === 'empresa' ? "Telefone (Obrigatório)" : "Telefone (Opcional)";

  return (
    <div className="space-y-6">
      <form action={dispatch} className="space-y-4">
        {formError && (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Falha no Cadastro</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
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
              setFormError(null); // Limpar erro ao mudar tipo de conta
              if (state?.errors) state.errors = {}; // Limpar erros de validação anteriores
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
              <button type="button" aria-label={showPassword ? "Esconder senha" : "Mostrar senha"} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-1 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            {state?.errors?.password && <p id="password-error" className="text-sm text-destructive">{state.errors.password.join(', ')}</p>}
            {password.length > 0 && (<div className="mt-1"><Progress value={passwordStrength.score} className={cn("h-2 w-full", passwordStrength.color)} indicatorClassName={cn(passwordStrength.color)} /><p className="text-xs mt-1 text-muted-foreground">Força da senha: {passwordStrength.label}</p></div>)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" required className="pl-10 pr-10" aria-describedby="confirmPassword-error" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="button" aria-label={showConfirmPassword ? "Esconder confirmação de senha" : "Mostrar confirmação de senha"} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-1 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
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

        <SubmitButton pendingText="Criando Conta..." disabled={isGoogleLoading}>
          Criar Conta <UserPlus className="ml-2 h-4 w-4" />
        </SubmitButton>
      </form>
      
      {accountType === 'pessoa' && ( // Login com Google geralmente é para Pessoa Física
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || state?.pending}>
             {isGoogleLoading ? "Redirecionando..." : (<><GoogleIcon /> Inscrever-se com Google</>)}
          </Button>
        </>
      )}
      
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
