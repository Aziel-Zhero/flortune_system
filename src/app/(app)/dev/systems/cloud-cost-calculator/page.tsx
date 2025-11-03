
// src/app/(app)/dev/systems/cloud-cost-calculator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Cloud, Construction, ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CloudCostCalculatorPage() {
  useEffect(() => {
    document.title = `Calculadora de Custos Cloud - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Calculadora de Custos Cloud"
        description="Simule o custo mensal de manter uma aplicação na nuvem."
        icon={<Cloud className="h-6 w-6 text-primary" />}
        actions={<Button asChild variant="outline"><Link href="/dev/systems"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>}
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
            Esta ferramenta para simular os custos de infraestrutura em provedores como AWS, Vercel e outros estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
