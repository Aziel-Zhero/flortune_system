
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loginUser, signInWithGoogle, type LoginFormState } from "@/app/actions/auth.actions";
import { OAuthButton } from "./oauth-button";
import { SubmitButton } from "./submit-button"; // Import the new SubmitButton

export function LoginForm() {
  const initialState: LoginFormState = { message: undefined, errors: {} };
  const [state, dispatch] = useActionState(loginUser, initialState);

  return (
    <form action={dispatch} className="space-y-6">
      {state?.errors?._form && (
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Login Failed</AlertTitle>
          <AlertDescription>{state.errors._form.join(', ')}</AlertDescription>
        </Alert>
      )}
       {state?.message && !state.success && !state.errors?._form && (
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state?.success && (
        <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700">
          <LogIn className="h-4 w-4 text-green-700 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">Success!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">{state.message}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
          <Link href="#" className="text-sm text-primary hover:underline">
            Forgot password?
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
      <SubmitButton pendingText="Signing In...">
        Sign In <LogIn className="ml-2 h-4 w-4" />
      </SubmitButton>
      <Separator className="my-6" />
      <OAuthButton providerName="Google" Icon={LogIn /* Placeholder, will be replaced by GoogleIcon */} onClick={signInWithGoogle} />
    </form>
  );
}
