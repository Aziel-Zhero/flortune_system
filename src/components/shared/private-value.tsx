
"use client";

import { useAppSettings } from '@/hooks/use-app-settings';
import { cn } from '@/lib/utils';
import type { ElementType } from 'react';

interface PrivateValueProps {
  value?: string | number | null;
  placeholder?: string;
  className?: string;
  as?: ElementType; // Allow specifying the HTML tag
}

export function PrivateValue({ 
  value, 
  placeholder = "••••", // Using dots for a more common privacy placeholder
  className, 
  as: Component = 'span' 
}: PrivateValueProps) {
  const { isPrivateMode } = useAppSettings();

  // Ensure value is a string for display, or use placeholder
  const displayValue = isPrivateMode 
    ? placeholder 
    : (value !== null && value !== undefined ? String(value) : 'N/A');

  return (
    <Component className={cn(
      isPrivateMode && "blur-[3px] select-none transition-all duration-150 ease-in-out", // Enhanced private mode style
      className
    )}>
      {displayValue}
    </Component>
  );
}
