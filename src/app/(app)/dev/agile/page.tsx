
// src/app/(app)/dev/agile/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IterationCw } from "lucide-react"; // Ícone para Metodologias Ágeis
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function DevAgilePage() {
  useEffect(() => {
    document.title = `Metodologias Ágeis (DEV) - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Metodologias Ágeis (DEV)"
        description="Página de desenvolvimento sobre metodologias ágeis."
        icon={<IterationCw className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Conteúdo de Metodologias Ágeis</CardTitle>
          <CardDescription>
            Esta é uma página placeholder para a seção de Metodologias Ágeis em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Informações e ferramentas sobre metodologias ágeis serão implementadas aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    