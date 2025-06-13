"use server";

import { z } from "zod";
import { redirect } from 'next/navigation';

const emailSchema = z.string().email({ message: "Invalid email address." });
const passwordSchema = z.string().min(8, { message: "Password must be at least 8 characters long." });

// Made internal: removed 'export'
const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Made internal: removed 'export'
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
    _form?: string[];
  };
  success?: boolean;
};

export async function loginUser(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input.",
    };
  }
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate success
  // In a real app, you would set a session cookie here
  // For now, we will redirect to dashboard
  // return { success: true, message: "Login successful!" };
  redirect('/dashboard'); // Temporary until session management is implemented

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
    };
  }

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate success
  // return { success: true, message: "Signup successful! Please login." };
  redirect('/login?signup=success'); // Temporary
}

export async function signInWithGoogle() {
  // Placeholder for Google Sign-In logic
  console.log("Attempting Google Sign-In...");
  // In a real app, this would redirect to Google's OAuth consent screen
  // and handle the callback.
  // For now, simulate success and redirect.
  await new Promise(resolve => setTimeout(resolve, 500));
  redirect('/dashboard');
}
