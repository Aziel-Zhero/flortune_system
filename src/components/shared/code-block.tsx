// src/components/shared/code-block.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setHasCopied(true);
      toast({ title: "Copiado!", description: "O código foi copiado para a área de transferência." });
      setTimeout(() => setHasCopied(false), 2000);
    }).catch(err => {
      toast({ title: "Erro ao copiar", description: "Não foi possível copiar o código.", variant: "destructive" });
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className={cn("relative rounded-md border bg-muted/50 p-4 font-mono text-sm", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7"
        onClick={handleCopy}
      >
        {hasCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="sr-only">Copiar código</span>
      </Button>
      <pre className="overflow-x-auto">
        <code className={language ? `language-${language}` : ''}>
          {code}
        </code>
      </pre>
    </div>
  );
}
