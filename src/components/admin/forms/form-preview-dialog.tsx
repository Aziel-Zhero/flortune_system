// src/components/admin/forms/form-preview-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star } from "lucide-react";
import type { FormQuestion } from "./question-item";

interface FormPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questions: FormQuestion[];
}

export function FormPreviewDialog({ isOpen, onOpenChange, questions }: FormPreviewDialogProps) {

  const renderQuestion = (question: FormQuestion) => {
    switch (question.type) {
      case 'text':
        return <Input placeholder="Sua resposta..." />;
      case 'textarea':
        return <Textarea placeholder="Digite sua resposta detalhada aqui..." />;
      case 'boolean':
        return (
          <RadioGroup className="flex gap-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id={`q-${question.id}-yes`} /><Label htmlFor={`q-${question.id}-yes`}>Sim</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id={`q-${question.id}-no`} /><Label htmlFor={`q-${question.id}-no`}>Não</Label></div>
          </RadioGroup>
        );
      case 'rating':
        return (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(value => (
              <Star key={value} className="h-6 w-6 text-yellow-400 cursor-pointer hover:text-yellow-500" />
            ))}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Pré-visualização do Formulário</DialogTitle>
          <DialogDescription>
            É assim que os usuários verão o formulário de avaliação.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
          {questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label className="font-semibold">{q.text}</Label>
              {renderQuestion(q)}
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
          <Button>Enviar Respostas (Simulação)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
