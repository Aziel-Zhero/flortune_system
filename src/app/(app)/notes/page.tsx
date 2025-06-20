
// src/app/(app)/notes/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotebookPen, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function NotesPage() {
  useEffect(() => {
    document.title = `Anotações - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Anotações"
        description="Seu espaço para ideias, lembretes e o que mais precisar anotar."
        icon={<NotebookPen className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Construction className="mr-2 h-5 w-5 text-amber-500" />
            Em Construção
          </CardTitle>
          <CardDescription>
            A funcionalidade de anotações com post-its, blocos e arrastar e soltar está em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve, você poderá organizar suas ideias e lembretes financeiros de forma visual e interativa aqui.
            Aguarde as novidades!
          </p>
          <div className="mt-6 flex justify-center">
            <NotebookPen className="h-24 w-24 text-muted-foreground/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    