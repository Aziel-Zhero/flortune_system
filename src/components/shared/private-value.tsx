"use client";

import { useAppSettings } from '@/hooks/use-app-settings';
import { cn } from '@/lib/utils';

interface PrivateValueProps {
  value?: string | number | null;
  placeholder?: string;
  className?: string;
  as?: React.ElementType;
}

export function PrivateValue({ value, placeholder = "***", className, as: Component = 'span' }: PrivateValueProps) {
  const { isPrivateMode } = useAppSettings();

  const displayValue = isPrivateMode ? placeholder : (value ?? 'N/A');

  return <Component className={cn(isPrivateMode && "blur-[2px] select-none", className)}>{displayValue}</Component>;
}
