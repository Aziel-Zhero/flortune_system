
// src/app/(app)/corporate/reports/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function CorporateReportsPage() {
  useEffect(() => {
    document.title = `Gráficos & Metas Corporativas - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Gráficos & Metas Corporativas"
        description="Visualize o desempenho da sua empresa, acompanhe metas e gere relatórios."
        icon={<AreaChart className="h-6 w-6 text-primary" />}
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
            A seção de relatórios avançados, com gráficos de performance, acompanhamento de metas de equipe e exportação em CSV/PDF, está em desenvolvimento e será lançada em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
