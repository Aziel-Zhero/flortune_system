
"use client";

import { useFormState } from "react-dom"; 
import { Link } from "next-intl/client"; // Use next-intl Link for client components
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loginUser, signInWithGoogle, type LoginFormState } from "@/app/actions/auth.actions"; 
import { OAuthButton } from "./oauth-button";
import { SubmitButton } from "./submit-button";
import { useTranslations } from "next-intl";
import { useSearchParams } from 'next/navigation'; // To read ?signup=success
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";


export function LoginForm() {
  const t = useTranslations('LoginForm');
  const searchParams = useSearchParams();
  const initialState: LoginFormState = { message: undefined, errors: {}, success: undefined };
  const [state, dispatch] = useFormState(loginUser, initialState);

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      // This toast is for successful signup redirecting to login
      // It might be better to show a more persistent message on the page itself
      // or use a dedicated success page/component.
      // For now, a toast might be okay.
      toast({
        title: t('successTitle'), // Assuming a generic success title
        description: "Your account has been created. Please sign in.", // Custom message
        variant: "default" // A non-destructive variant
      });
    }
  }, [searchParams, t]);

  useEffect(() => {
    if (state.message && !state.success && state.errors?._form) {
      // Error from form validation (e.g. wrong password)
      // Alert is already handled by the general error display logic below
    } else if (state.message && !state.success) {
      // Other errors not tied to specific fields
      toast({
        title: t('errorTitle'),
        description: state.message,
        variant: "destructive",
      });
    }
    // Success state is handled by redirect in server action, login form won't re-render with success usually.
  }, [state, t]);


  return (
    <form action={dispatch} className="space-y-6">
      {state?.errors?._form && (
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('loginFailedTitle')}</AlertTitle>
          <AlertDescription>{state.errors._form.join(', ')}</AlertDescription>
        </Alert>
      )}
       {/* General message display, if not success and not a form error */}
      {state?.message && !state.success && !state.errors?._form && (
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {/* Success message (e.g. password reset link sent, if that were a feature) */}
      {/* For login, success usually means redirect, so this might not show often */}
      {state?.success && state.message && (
        <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700">
          <LogIn className="h-4 w-4 text-green-700 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">{t('successTitle')}</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            className="pl-10"
            aria-describedby="email-error"
          />
        </div>
        {state?.errors?.email && <p id="email-error" className="text-sm text-destructive">{state.errors.email.join(', ')}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('passwordLabel')}</Label>
          <Link href="#" className="text-sm text-primary hover:underline">
            {t('forgotPasswordLink')}
          </Link>
        </div>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            id="password" 
            name="password" 
            type="password" 
            required 
            placeholder="••••••••" 
            className="pl-10"
            aria-describedby="password-error"
          />
        </div>
        {state?.errors?.password && <p id="password-error" className="text-sm text-destructive">{state.errors.password.join(', ')}</p>}
      </div>
      <SubmitButton pendingTextKey="SubmitButton.signingIn"> {/* Adjusted key */}
        {t('signInButton')} <LogIn className="ml-2 h-4 w-4" />
      </SubmitButton>
      <Separator className="my-6" />
      {/* Assuming OAuthButton is correctly set up for i18n if it contains text */}
      <OAuthButton providerName="Google" Icon={LogIn} action={signInWithGoogle} buttonText={t('signInWithButton', {providerName: 'Google'})}/>
    </form>
  );
}

