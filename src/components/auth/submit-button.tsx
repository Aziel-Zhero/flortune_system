
"use client";

import { useFormStatus } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  pendingText: string;
  children: React.ReactNode; // Content for the non-pending state
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

export function SubmitButton({ pendingText, children, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className={cn("w-full", className)} disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

// Helper function for cn, assuming it might be needed if not globally available in this context
// For robustness, explicitly include a minimal cn if not relying on an implicit one.
// However, given the project structure, "@/lib/utils" should be accessible.
// If issues arise with cn, it would need to be imported: import { cn } from "@/lib/utils";
// For now, assuming Button component internally uses cn or it's applied at usage.
// Added cn to the className prop for direct usage.
const cn = (...inputs:any[]) => inputs.filter(Boolean).join(' ');
