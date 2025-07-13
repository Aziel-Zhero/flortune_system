// src/app/(app)/dev/systems/complexity-estimator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sigma, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function ComplexityEstimatorPage() {
  useEffect(() => {
    document.title = `Estimador de Complexidade Técnica - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Estimador de Complexidade Técnica"
        description="Avalie a complexidade de um sistema para orçar ou planejar sprints."
        icon={<Sigma className="h-6 w-6 text-primary" />}
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
            Esta ferramenta para gerar um score de complexidade técnica de projetos estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
