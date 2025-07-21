// src/components/settings/quote-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3 } from "lucide-react";
import { useAppSettings } from "@/contexts/app-settings-context";
import { toast } from "@/hooks/use-toast";
import { AVAILABLE_QUOTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface QuoteSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteSettingsDialog({ isOpen, onOpenChange }: QuoteSettingsDialogProps) {
  const { selectedQuotes, setSelectedQuotes, loadQuotes, showQuotes, setShowQuotes } = useAppSettings();
  const [localSelectedCodes, setLocalSelectedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedCodes(new Set(selectedQuotes));
    }
  }, [isOpen, selectedQuotes]);

  const handleCheckboxChange = (code: string, checked: boolean) => {
    setLocalSelectedCodes(prev => {
      const newSet = new Set(prev);
      if (checked) {
        if (newSet.size < 5) {
          newSet.add(code);
        } else {
          toast({
            title: "Limite Atingido",
            description: "Você pode selecionar no máximo 5 cotações.",
            variant: "destructive",
          });
        }
      } else {
        newSet.delete(code);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    const newSelectedQuotes = Array.from(localSelectedCodes);
    setSelectedQuotes(newSelectedQuotes);
    loadQuotes(newSelectedQuotes);
    
    toast({ title: "Cotações Atualizadas!", description: "Seu painel foi atualizado." });
    onOpenChange(false);
  };

  const isAtLimit = localSelectedCodes.size >= 5;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Configurar Cotações do Painel
          </DialogTitle>
          <DialogDescription>
            Ative e escolha até 5 cotações para exibir no seu dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <Switch id="show-quotes-switch" checked={showQuotes} onCheckedChange={setShowQuotes} />
              <Label htmlFor="show-quotes-switch" className="flex flex-col cursor-pointer">
                <span className="font-medium">Exibir Cotações no Painel</span>
                <span className="text-xs text-muted-foreground">Ative para ver os cards de cotações de mercado.</span>
              </Label>
            </div>

            <div className={cn("space-y-4 transition-opacity", !showQuotes && "opacity-50 pointer-events-none")}>
              <Label>Cotações Disponíveis</Label>
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {AVAILABLE_QUOTES.map(quote => {
                        const isChecked = localSelectedCodes.has(quote.code);
                        return (
                           <div key={quote.code} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50">
                             <Checkbox
                               id={`quote-${quote.code}`}
                               checked={isChecked}
                               onCheckedChange={(checked) => handleCheckboxChange(quote.code, !!checked)}
                               disabled={!isChecked && isAtLimit}
                              />
                             <Label htmlFor={`quote-${quote.code}`} className={cn("flex-1 cursor-pointer", !isChecked && isAtLimit && "text-muted-foreground/50")}>
                               {quote.name} ({quote.code})
                             </Label>
                           </div>
                        )
                    })}
                  </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground text-center">
                Selecionadas: {localSelectedCodes.size} de 5
              </p>
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Salvar Configurações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
