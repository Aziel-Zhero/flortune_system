// src/app/(app)/dev/systems/freelancer-billing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function FreelancerBillingPage() {
  useEffect(() => {
    document.title = `Calculadora de Faturamento Freelancer - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Calculadora de Faturamento Dev Freelancer"
        description="Planeje seu faturamento com base em carga horária, folgas e valor hora."
        icon={<DollarSign className="h-6 w-6 text-primary" />}
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
            Esta ferramenta para planejar suas metas de faturamento mensal e anual como freelancer estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
