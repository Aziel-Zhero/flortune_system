
"use client";

import { useFormStatus } from "react-dom"; 
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
