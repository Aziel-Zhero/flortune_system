import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode; // Added icon prop
}

export function PageHeader({ title, description, actions, className, icon }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 md:mb-8 min-w-0", className)}>
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center min-w-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight font-headline md:text-3xl flex flex-wrap items-center gap-3 min-w-0 break-words">
            {icon && <span className="text-primary">{icon}</span>}
            <span className="min-w-0">{title}</span>
          </h1>
          {description && (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground break-words">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 gap-2 flex-wrap items-center justify-end w-full md:w-auto">{actions}</div>}
      </div>
    </div>
  );
}
