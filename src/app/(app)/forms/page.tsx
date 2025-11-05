// src/app/(app)/forms/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClipboardList, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function FormsPage() {
  useEffect(() => {
    document.title = `Formulários - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Formulários"
        description="Crie e gerencie formulários para coletar feedback, sugestões e opiniões."
        icon={<ClipboardList className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
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
