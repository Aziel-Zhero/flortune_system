// src/app/(admin)/admin/forms/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardList, Construction } from "lucide-react";
import { useEffect } from "react";

export default function AdminFormsPage() {
  useEffect(() => {
    document.title = "Gestão de Formulários - Flortune";
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestão de Formulários"
        icon={<ClipboardList />}
        description="Crie e gerencie formulários para coletar feedback, sugestões e opiniões."
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Construction className="mr-2 h-5 w-5 text-amber-500" />
            Em Construção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta área será dedicada à criação e gerenciamento de formulários customizáveis. Em breve, você poderá criar pesquisas, caixas de sugestão e muito mais para engajar sua comunidade.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
