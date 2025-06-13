
"use client";

import { useFormStatus } from "react-dom"; 
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface SubmitButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  pendingTextKey: string; // Changed to key for translation
  children: React.ReactNode; // Content for the non-pending state
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

export function SubmitButton({ pendingTextKey, children, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const t = useTranslations('SubmitButton');

  return (
    <Button type="submit" className={cn("w-full", className)} disabled={pending} {...props}>
      {pending ? t(pendingTextKey as any) : children}
    </Button>
  );
}
