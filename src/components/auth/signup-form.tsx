
"use client";

import { useFormState } from "react-dom";
import { AlertTriangle, UserPlus, KeyRound, Mail, User as UserIcon, LogIn } from "lucide-react"; // Renamed User to UserIcon
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signupUser, signInWithGoogle, type SignupFormState } from "@/app/actions/auth.actions";
import { OAuthButton } from "./oauth-button";
import { SubmitButton } from "./submit-button";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export function SignupForm() {
  const t = useTranslations('SignupForm');
  const initialState: SignupFormState = { message: undefined, errors: {}, success: undefined };
  const [state, dispatch] = useFormState(signupUser, initialState);

  useEffect(() => {
    if (state.message && !state.success && state.errors?._form) {
      // Error from form validation already handled by Alert below
    } else if (state.message && !state.success) {
      toast({
        title: t('errorTitle'),
        description: state.message,
        variant: "destructive",
      });
    } else if (state.success && state.message) {
      // For signup, success usually redirects. If we want to show a message before redirect,
      // the server action would need to return success: true and a message,
      // and then client-side would handle the redirect after showing the toast.
      // Current action redirects immediately.
      // This part might not be hit if redirect happens in server action.
       toast({
        title: t('successTitle'),
        description: state.message,
        variant: "default"
      });
    }
  }, [state, t]);


  return (
    <form action={dispatch} className="space-y-6">
      {state?.errors?._form && (
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('signupFailedTitle')}</AlertTitle>
          <AlertDescription>{state.errors._form.join(', ')}</AlertDescription>
        </Alert>
      )}
       {state?.message && !state.success && !state.errors?._form && (
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {/* This success alert might not show if redirect happens in server action */}
      {state?.success && state.message && (
        <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700">
          <UserPlus className="h-4 w-4 text-green-700 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">{t('successTitle')}</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">{t('fullNameLabel')}</Label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="name" name="name" placeholder="John Doe" required className="pl-10" aria-describedby="name-error" />
        </div>
        {state?.errors?.name && <p id="name-error" className="text-sm text-destructive">{state.errors.name.join(', ')}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" name="email" type="email" placeholder="name@example.com" required className="pl-10" aria-describedby="email-error" />
        </div>
        {state?.errors?.email && <p id="email-error" className="text-sm text-destructive">{state.errors.email.join(', ')}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="password" name="password" type="password" placeholder="••••••••" required className="pl-10" aria-describedby="password-error" />
        </div>
        {state?.errors?.password && <p id="password-error" className="text-sm text-destructive">{state.errors.password.join(', ')}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required className="pl-10" aria-describedby="confirmPassword-error" />
        </div>
        {state?.errors?.confirmPassword && <p id="confirmPassword-error" className="text-sm text-destructive">{state.errors.confirmPassword.join(', ')}</p>}
      </div>
      
      <SubmitButton pendingTextKey="SubmitButton.creatingAccount"> {/* Adjusted key */}
        {t('createAccountButton')} <UserPlus className="ml-2 h-4 w-4" />
      </SubmitButton>
      <Separator className="my-6" />
      <OAuthButton providerName="Google" Icon={LogIn} action={signInWithGoogle} buttonText={t('signInWithButton', {providerName: 'Google'})} />
    </form>
  );
}
