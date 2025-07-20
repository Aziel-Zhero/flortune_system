
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
import { Switch } from "@/components/ui/switch";
import { BarChart3, Plus, Trash2 } from "lucide-react";
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
  const [localQuotes, setLocalQuotes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalQuotes(selectedQuotes);
    }
  }, [isOpen, selectedQuotes]);

  const handleAddQuoteField = () => {
    if (localQuotes.length >= 5) {
      toast({ title: "Limite atingido", description: "Você pode selecionar no máximo 5 cotações.", variant: "destructive" });
      return;
    }
    setLocalQuotes(prev => [...prev, ""]);
  };

  const handleRemoveQuoteField = (index: number) => {
    setLocalQuotes(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSelectChange = (index: number, value: string) => {
    // Verificar se a cotação já foi selecionada
    if (value && localQuotes.some((q, i) => q === value && i !== index)) {
        toast({ title: "Cotação Repetida", description: "Esta cotação já foi selecionada. Escolha outra.", variant: "destructive"});
        return;
    }
    const newQuotes = [...localQuotes];
    newQuotes[index] = value;
    setLocalQuotes(newQuotes);
  };

  const handleSave = () => {
    const cleanedQuotes = localQuotes.filter(q => q && q !== "");
    setSelectedQuotes(cleanedQuotes);
    loadQuotes(cleanedQuotes);
    
    toast({ title: "Cotações Atualizadas!", description: "Seu painel foi atualizado." });
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
            Ative, desative e escolha quais cotações você deseja acompanhar no seu dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <Switch id="show-quotes-switch" checked={showQuotes} onCheckedChange={setShowQuotes} />
              <Label htmlFor="show-quotes-switch" className="flex flex-col">
                <span className="font-medium">Exibir Cotações no Painel</span>
                <span className="text-xs text-muted-foreground">Ative para ver os cards de cotações de mercado.</span>
              </Label>
            </div>

            <div className={cn("space-y-4 transition-opacity", !showQuotes && "opacity-50 pointer-events-none")}>
              {localQuotes.map((quote, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-grow space-y-1.5">
                    <Label htmlFor={`quote-select-${index}`} className="text-xs">Cotação {index + 1}</Label>
                    <Select value={quote} onValueChange={(value) => handleSelectChange(index, value)}>
                      <SelectTrigger id={`quote-select-${index}`}>
                        <SelectValue placeholder="Selecione uma cotação..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_QUOTES.map(q => (
                          <SelectItem key={q.code} value={q.code} disabled={localQuotes.includes(q.code) && quote !== q.code}>
                            {q.name} ({q.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="self-end text-muted-foreground hover:text-destructive" onClick={() => handleRemoveQuoteField(index)}>
                      <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              ))}
              {localQuotes.length < 5 && (
                <Button variant="outline" size="sm" onClick={handleAddQuoteField}>
                    <Plus className="mr-2 h-4 w-4"/> Adicionar Cotação
                </Button>
              )}
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
