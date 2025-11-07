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
import { BarChart3, AlertCircle } from "lucide-react";
import { useAppSettings } from "@/contexts/app-settings-context";
import { toast } from "@/hooks/use-toast";
import { AVAILABLE_QUOTES } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface QuoteSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteSettingsDialog({ isOpen, onOpenChange }: QuoteSettingsDialogProps) {
  const { selectedQuotes, setSelectedQuotes } = useAppSettings();
  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const MAX_QUOTES = 5;

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(selectedQuotes);
    }
  }, [isOpen, selectedQuotes]);

  const handleCheckedChange = (checked: boolean, code: string) => {
    setLocalSelection(prev => {
      const isCurrentlySelected = prev.includes(code);
      if (checked && !isCurrentlySelected) {
        if (prev.length < MAX_QUOTES) {
          return [...prev, code];
        } else {
          toast({
            title: `Limite de ${MAX_QUOTES} cotações atingido`,
            description: "Desmarque uma cotação para selecionar outra.",
            variant: "destructive"
          });
          return prev;
        }
      } else if (!checked && isCurrentlySelected) {
        return prev.filter(item => item !== code);
      }
      return prev;
    });
  };

  const handleSave = () => {
    if (localSelection.length !== MAX_QUOTES) {
       toast({
        title: "Seleção Incompleta",
        description: `Por favor, selecione exatamente ${MAX_QUOTES} cotações.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedQuotes(localSelection);
    toast({ title: "Cotações Atualizadas!", description: "Seu painel foi atualizado com as novas cotações." });
    onOpenChange(false);
  };
  
  const canSelectMore = localSelection.length >= MAX_QUOTES;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Configurar Cotações do Painel
          </DialogTitle>
          <DialogDescription>
            Escolha exatamente {MAX_QUOTES} cotações para acompanhar no seu dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Selecione {MAX_QUOTES} cotações</AlertTitle>
            <AlertDescription>
              Você selecionou {localSelection.length} de {MAX_QUOTES}.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-2 gap-4 mt-4 max-h-60 overflow-y-auto pr-2">
            {AVAILABLE_QUOTES.map(q => {
              const isChecked = localSelection.includes(q.code);
              return (
                <div key={q.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`quote-check-${q.code}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleCheckedChange(Boolean(checked), q.code)}
                    disabled={!isChecked && canSelectMore}
                  />
                  <Label
                    htmlFor={`quote-check-${q.code}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {q.name} ({q.code})
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
