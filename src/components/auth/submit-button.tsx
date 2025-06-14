
"use client";

import { useFormStatus } from "react-dom"; 
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface SubmitButtonProps extends Omit<ButtonProps, 'children' | 'type' | 'disabled'> {
  pendingTextKey: string; // e.g., "SubmitButton.signingIn"
  children: React.ReactNode; 
  className?: string;
}

export function SubmitButton({ pendingTextKey, children, className, variant, size, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const t = useTranslations(); // General namespace or pass specific one if needed

  return (
    <Button 
      type="submit" 
      className={cn("w-full", className)} 
      disabled={pending}
      variant={variant}
      size={size}
      {...props}
    >
      {pending ? t(pendingTextKey as any) : children}
    </Button>
  );
}
