// src/components/admin/forms/form-preview-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { FormQuestion } from "./question-item";
import { cn } from "@/lib/utils";

interface FormPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questions: FormQuestion[];
}

const QUESTIONS_PER_PAGE = 5;

export function FormPreviewDialog({ isOpen, onOpenChange, questions }: FormPreviewDialogProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [rating, setRating] = useState<number | null>(null);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, endIndex);

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
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: 11 }, (_, i) => i).map(value => (
              <Button
                key={value}
                type="button"
                variant={rating === value ? "default" : "outline"}
                className={cn(
                  "h-8 w-8 p-0 rounded-md",
                  value <= 6 && rating === value && "bg-destructive",
                  value >= 7 && value <= 8 && rating === value && "bg-yellow-500",
                  value >= 9 && rating === value && "bg-green-500"
                )}
                onClick={() => setRating(value)}
              >
                {value}
              </Button>
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
          {currentQuestions.map((q) => (
            <div key={q.id} className="space-y-3 p-4 border-b last:border-b-0">
              <Label className="font-semibold">{q.text}</Label>
              {renderQuestion(q)}
            </div>
          ))}
        </div>
        <DialogFooter className="justify-between">
          <div>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {currentPage > 0 && (
              <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
              </Button>
            )}
            {currentPage < totalPages - 1 ? (
              <Button onClick={() => setCurrentPage(p => p + 1)}>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button>Enviar Respostas (Simulação)</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
