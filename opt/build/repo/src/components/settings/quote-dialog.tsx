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
import { ScrollArea } from "../ui/scroll-area";

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

      // Se está marcando uma cotação
      if (checked && !isCurrentlySelected) {
        if (prev.length >= MAX_QUOTES) {
          toast({
            title: `Limite de ${MAX_QUOTES} cotações atingido`,
            description: "Desmarque uma cotação para selecionar outra.",
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, code];
      } 
      // Se está desmarcando uma cotação
      else if (!checked && isCurrentlySelected) {
        return prev.filter(item => item !== code);
      }
      return prev;
    });
  };

  const handleSave = () => {
    setSelectedQuotes(localSelection);
    toast({ title: "Cotações Atualizadas!", description: "Seu painel foi atualizado com as novas cotações." });
    onOpenChange(false);
  };

  const canSave = localSelection.length > 0 && localSelection.length <= MAX_QUOTES;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Configurar Cotações do Painel
          </DialogTitle>
          <DialogDescription>
            Escolha até {MAX_QUOTES} cotações para acompanhar no seu dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Alert variant={localSelection.length >= MAX_QUOTES ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Selecione suas cotações</AlertTitle>
            <AlertDescription>
              Você selecionou {localSelection.length} de {MAX_QUOTES}.
            </AlertDescription>
          </Alert>
          <ScrollArea className="h-60 mt-4 pr-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {AVAILABLE_QUOTES.map(q => {
                const isChecked = localSelection.includes(q.code);
                const isDisabled = localSelection.length >= MAX_QUOTES && !isChecked;

                return (
                  <div key={q.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`quote-check-${q.code}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleCheckedChange(Boolean(checked), q.code)}
                      disabled={isDisabled}  // Desabilita apenas quando o limite foi atingido e a cotação não está selecionada
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
          </ScrollArea>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
