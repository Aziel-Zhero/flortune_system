
// src/app/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';
// Note: next-intl's redirect is for client-side, use next/navigation for server actions

const emailSchema = z.string().email({ message: "Invalid email address." });
const passwordSchema = z.string().min(8, { message: "Password must be at least 8 characters long." });

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export type LoginFormState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[]; // For general form errors
  };
  success?: boolean;
};

export async function loginUser(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input.",
      success: false,
    };
  }
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  // IMPORTANT: Redirects from server actions do NOT automatically get locale prefixes.
  // The middleware is expected to catch this and add the locale.
  // If /dashboard is a protected route, ensure middleware handles this.
  redirect('/dashboard'); 
  // This will be caught by middleware, which should prepend the current/default locale.
}

export type SignupFormState = {
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function signupUser(prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input.",
      success: false,
    };
  }

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate success
  // Redirect to login page, middleware should add locale.
  redirect('/login?signup=success'); 
}

export async function signInWithGoogle() {
  console.log("Attempting Google Sign-In...");
  // In a real app, this would involve redirecting to Google's OAuth consent screen
  // and handling the callback, likely setting a session.
  await new Promise(resolve => setTimeout(resolve, 500));
  redirect('/dashboard'); // Middleware to add locale
}

// You might want a server action for logout as well
export async function logoutUser() {
  console.log("Logging out user (server action)...");
  // Clear session/cookie here in a real app
  redirect('/login'); // Middleware to add locale
}
