// src/components/admin/forms/form-editor-dialog.tsx
"use client";

import { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormQuestion } from "./question-item";

interface FormEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  question: FormQuestion | null;
  onSave: (data: FormQuestion) => void;
}

const formSchema = z.object({
  text: z.string().min(5, "A pergunta deve ter pelo menos 5 caracteres."),
  type: z.enum(['text', 'textarea', 'rating', 'boolean']),
  category: z.enum(['Geral', 'Usabilidade', 'Design', 'Funcionalidades', 'Recursos']),
});

type FormEditorData = z.infer<typeof formSchema>;

export function FormEditorDialog({ isOpen, onOpenChange, question, onSave }: FormEditorDialogProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormEditorData>({
    resolver: zodResolver(formSchema),
  });
  
  useEffect(() => {
    if (isOpen && question) {
      reset(question);
    } else if (isOpen && !question) {
      reset({ text: "", type: "text", category: "Geral" });
    }
  }, [isOpen, question, reset]);

  const onSubmit: SubmitHandler<FormEditorData> = (data) => {
    const finalData: FormQuestion = {
        id: question?.id || `q_${Date.now()}`,
        ...data,
    };
    onSave(finalData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{question ? "Editar Pergunta" : "Adicionar Nova Pergunta"}</DialogTitle>
          <DialogDescription>
            Personalize o texto, tipo e categoria da pergunta do formulário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="question-text">Texto da Pergunta</Label>
            <Textarea id="question-text" {...register("text")} rows={3} />
            {errors.text && <p className="text-sm text-destructive mt-1">{errors.text.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="question-type">Tipo de Resposta</Label>
                <Controller name="type" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="question-type"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">Texto Curto</SelectItem>
                            <SelectItem value="textarea">Texto Longo</SelectItem>
                            <SelectItem value="rating">Avaliação (1-5)</SelectItem>
                            <SelectItem value="boolean">Sim/Não</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="question-category">Categoria</Label>
                <Controller name="category" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="question-category"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Geral">Geral</SelectItem>
                            <SelectItem value="Usabilidade">Usabilidade</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Funcionalidades">Funcionalidades</SelectItem>
                            <SelectItem value="Recursos">Recursos</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit">Salvar Pergunta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
