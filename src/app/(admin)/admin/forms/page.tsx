// src/app/(admin)/admin/forms/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, PlusCircle, Save } from "lucide-react";
import { QuestionItem, type FormQuestion } from "@/components/admin/forms/question-item";
import { toast } from "@/hooks/use-toast";

const initialQuestions: FormQuestion[] = [
    { id: 'q1', text: 'Em uma escala de 1 a 5, qual a sua satisfação geral com o Flortune?', type: 'rating', category: 'Geral' },
    { id: 'q2', text: 'Qual funcionalidade você mais utiliza?', type: 'text', category: 'Funcionalidades' },
    { id: 'q3', text: 'Você encontrou alguma dificuldade ao usar o aplicativo? Se sim, qual?', type: 'textarea', category: 'Usabilidade' },
    { id: 'q4', text: 'O design do aplicativo é agradável e intuitivo?', type: 'boolean', category: 'Design' },
    { id: 'q5', text: 'Que nova funcionalidade você gostaria de ver no futuro?', type: 'textarea', category: 'Recursos' },
];


export default function AdminFormsPage() {
  const [questions, setQuestions] = useState(initialQuestions);

  useEffect(() => {
    document.title = "Gestão de Formulários - Flortune";
  }, []);
  
  const handleAddQuestion = () => {
    toast({
        title: "Funcionalidade em Desenvolvimento",
        description: "A adição de novas perguntas será implementada em breve."
    })
  }
  
  const handleSaveChanges = () => {
     toast({
        title: "Alterações Salvas (Simulação)",
        description: "A ordem e o conteúdo do formulário foram salvos."
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestão de Formulários"
        icon={<ClipboardList />}
        description="Crie e gerencie formulários para coletar feedback, sugestões e opiniões."
      />

      <Card>
        <CardHeader>
          <CardTitle>Formulário de Avaliação de Experiência do Usuário</CardTitle>
          <CardDescription>Gerencie as perguntas que serão exibidas aos usuários para coletar feedback sobre o produto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-3 p-4 border rounded-lg bg-background/50">
                {questions.map(q => (
                    <QuestionItem key={q.id} question={q} />
                ))}
            </div>
            <Button variant="outline" onClick={handleAddQuestion}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Pergunta
            </Button>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações no Formulário
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
