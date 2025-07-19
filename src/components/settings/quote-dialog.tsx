
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import { useAppSettings } from "@/contexts/app-settings-context";
import { toast } from "@/hooks/use-toast";
import { AVAILABLE_QUOTES } from "@/lib/constants";

interface QuoteSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteSettingsDialog({ isOpen, onOpenChange }: QuoteSettingsDialogProps) {
  const { selectedQuotes, setSelectedQuotes } = useAppSettings();
  const [localQuotes, setLocalQuotes] = useState<string[]>(['none', 'none', 'none', 'none', 'none']);

  useEffect(() => {
    if (isOpen) {
      const initialQuotes = Array(5).fill('none').map((_, i) => selectedQuotes[i] || 'none');
      setLocalQuotes(initialQuotes);
    }
  }, [isOpen, selectedQuotes]);

  const handleSelectChange = (index: number, value: string) => {
    const newQuotes = [...localQuotes];
    newQuotes[index] = value;
    setLocalQuotes(newQuotes);
  };

  const handleSave = () => {
    setSelectedQuotes(localQuotes);
    toast({ title: "Cotações Atualizadas!", description: "Seu painel foi atualizado com as novas cotações." });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Configurar Cotações do Painel
          </DialogTitle>
          <DialogDescription>
            Escolha até 5 cotações que você deseja acompanhar no seu dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {localQuotes.map((quote, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`quote-select-${index}`}>Cotação {index + 1}</Label>
              <Select value={quote} onValueChange={(value) => handleSelectChange(index, value)}>
                <SelectTrigger id={`quote-select-${index}`}>
                  <SelectValue placeholder="Selecione uma cotação..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {AVAILABLE_QUOTES.map(q => (
                    <SelectItem key={q.code} value={q.code}>
                      {q.name} ({q.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
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
