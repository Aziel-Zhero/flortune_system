"use client";

import { useFormStatus } from "react-dom"; 
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends Omit<ButtonProps, 'children' | 'type' | 'disabled'> {
  pendingText: string; // Changed from pendingTextKey
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
      {pending ? pendingText : children}
    </Button>
  );
}
