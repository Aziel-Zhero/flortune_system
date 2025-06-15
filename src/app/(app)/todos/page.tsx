// src/app/(app)/todos/page.tsx
// Esta página foi temporariamente desativada para focar na autenticação.
// Ela será reintroduzida em uma fase posterior com integração ao user_id.
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { useEffect } from "react";
import { APP_NAME } from "@/lib/constants";

export default function TodosPage() {
  useEffect(() => {
    document.title = `Lista de Tarefas - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Lista de Tarefas"
        description="Organize suas pendências financeiras e outras tarefas importantes."
        icon={<ListChecks className="mr-2 h-6 w-6 text-primary" />}
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Funcionalidade em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A lista de tarefas está sendo aprimorada e será integrada com sua conta de usuário em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
