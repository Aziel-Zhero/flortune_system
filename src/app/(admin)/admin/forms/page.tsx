// src/app/(admin)/admin/forms/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, PlusCircle, Save } from "lucide-react";
import { QuestionItem, type FormQuestion } from "@/components/admin/forms/question-item";
import { toast } from "@/hooks/use-toast";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormEditorDialog } from "@/components/admin/forms/form-editor-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const initialQuestions: FormQuestion[] = [
    { id: 'q1', text: 'Em uma escala de 1 a 5, qual a sua satisfação geral com o Flortune?', type: 'rating', category: 'Geral' },
    { id: 'q2', text: 'Qual funcionalidade você mais utiliza?', type: 'text', category: 'Funcionalidades' },
    { id: 'q3', text: 'Você encontrou alguma dificuldade ao usar o aplicativo? Se sim, qual?', type: 'textarea', category: 'Usabilidade' },
    { id: 'q4', text: 'O design do aplicativo é agradável e intuitivo?', type: 'boolean', category: 'Design' },
    { id: 'q5', text: 'Que nova funcionalidade você gostaria de ver no futuro?', type: 'textarea', category: 'Recursos' },
];


export default function AdminFormsPage() {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<FormQuestion | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }));

  useEffect(() => {
    setIsClient(true);
    document.title = "Gestão de Formulários - Flortune";
    try {
        const stored = localStorage.getItem("flortune-admin-form-questions");
        if (stored) {
            setQuestions(JSON.parse(stored));
        } else {
            setQuestions(initialQuestions);
        }
    } catch(e) { console.error(e); setQuestions(initialQuestions); }
  }, []);

  useEffect(() => {
    if (isClient) {
        localStorage.setItem("flortune-admin-form-questions", JSON.stringify(questions));
    }
  }, [questions, isClient]);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
        setQuestions((items) => {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    }
  };

  const handleOpenEditor = (question: FormQuestion | null) => {
    setEditingQuestion(question);
    setIsEditorOpen(true);
  };
  
  const handleSaveQuestion = (questionData: FormQuestion) => {
    if (editingQuestion) {
        // Update
        setQuestions(prev => prev.map(q => q.id === questionData.id ? questionData : q));
        toast({ title: "Pergunta Atualizada!"});
    } else {
        // Add
        setQuestions(prev => [...prev, questionData]);
        toast({ title: "Pergunta Adicionada!"});
    }
    setIsEditorOpen(false);
  };
  
  const handleDeleteConfirm = () => {
    if (deletingQuestion) {
        setQuestions(prev => prev.filter(q => q.id !== deletingQuestion.id));
        toast({ title: "Pergunta Removida", variant: "destructive" });
        setDeletingQuestion(null);
    }
  };

  const handleSaveChanges = () => {
     toast({
        title: "Alterações Salvas",
        description: "A ordem do formulário foi salva com sucesso."
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestão de Formulários"
        icon={<ClipboardList />}
        description="Crie e gerencie formulários para coletar feedback, sugestões e opiniões."
        actions={<Button onClick={() => handleOpenEditor(null)}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Pergunta</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Formulário de Avaliação de Experiência do Usuário</CardTitle>
          <CardDescription>Arraste as perguntas para reordenar, edite ou remova-as conforme necessário.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-3 p-4 border rounded-lg bg-background/50">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {questions.map(q => (
                        <QuestionItem 
                            key={q.id} 
                            question={q} 
                            onEdit={() => handleOpenEditor(q)}
                            onDelete={() => setDeletingQuestion(q)}
                        />
                    ))}
                  </SortableContext>
              </DndContext>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Ordem do Formulário
            </Button>
        </CardFooter>
      </Card>
      
      <FormEditorDialog 
        isOpen={isEditorOpen} 
        onOpenChange={setIsEditorOpen} 
        question={editingQuestion}
        onSave={handleSaveQuestion}
      />
      
      <AlertDialog open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza de que deseja excluir a pergunta "{deletingQuestion?.text}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingQuestion(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
