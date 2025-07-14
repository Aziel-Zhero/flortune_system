
// src/app/(app)/dev/systems/agile-estimator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GanttChartSquare, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function AgileEstimatorPage() {
  useEffect(() => {
    document.title = `Estimador Ágil - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Estimador Ágil (Sprint Estimator)"
        description="Estime o esforço de um projeto ágil baseado em story points e velocidade da equipe."
        icon={<GanttChartSquare className="h-6 w-6 text-primary" />}
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
            Esta ferramenta para estimar o tempo e o número de sprints de seus projetos ágeis estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
