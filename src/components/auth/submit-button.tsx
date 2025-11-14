// src/components/auth/submit-button.tsx
"use client";

import { useFormStatus } from "react-dom"; 
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends Omit<ButtonProps, 'children' | 'type' | 'disabled'> {
  pendingText: string;
  children: React.ReactNode; 
  className?: string;
}

export function SubmitButton({ pendingText, children, className, variant, size, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      className={cn("w-full", className)} 
      disabled={pending}
      variant={variant}
      size={size}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
