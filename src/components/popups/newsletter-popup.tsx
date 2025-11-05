// src/components/popups/newsletter-popup.tsx
"use client";

import { motion } from "framer-motion";
import { Newspaper, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { PopupConfig } from "@/contexts/app-settings-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PopupProps {
  config: PopupConfig;
  onDismiss?: () => void;
}

const getLucideIcon = (name: string): React.ElementType => {
    return (LucideIcons as any)[name] || Newspaper;
}

const colorClasses = {
  primary: "border-primary/50 bg-primary/10 text-primary-foreground",
  destructive: "border-destructive/50 bg-destructive/10 text-destructive-foreground",
  amber: "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  blue: "border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-200",
};

const iconColorClasses = {
  primary: "text-primary",
  destructive: "text-destructive",
  amber: "text-amber-500",
  blue: "text-blue-500",
};


export function NewsletterPopup({ config, onDismiss }: PopupProps) {
  const Icon = getLucideIcon(config.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 100 }}
      className={cn(
        "w-full max-w-sm rounded-lg border p-4 shadow-2xl backdrop-blur-md",
        colorClasses[config.color] || colorClasses.primary
      )}
    >
      <div className="flex items-start gap-4">
        <Icon className={cn("h-6 w-6 shrink-0 mt-1", iconColorClasses[config.color] || iconColorClasses.primary)} />
        <div className="flex-grow space-y-3">
            <div>
                <h3 className="font-semibold font-headline">{config.title}</h3>
                <p className="text-sm opacity-90">{config.description}</p>
            </div>
            <form className="flex gap-2">
                <Input type="email" placeholder="seu@email.com" className="bg-background/70" />
                <Button type="submit" variant="default">Inscrever</Button>
            </form>
        </div>
        {onDismiss && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-2 -mt-2" onClick={onDismiss}>
                <X className="h-4 w-4" />
            </Button>
        )}
      </div>
    </motion.div>
  );
}
