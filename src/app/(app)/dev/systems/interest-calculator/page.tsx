
// src/app/(app)/dev/systems/interest-calculator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function InterestCalculatorPage() {
  useEffect(() => {
    document.title = `Calculadora de Juros - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Calculadora de Juros"
        description="Simule juros simples e compostos para seus investimentos ou empréstimos."
        icon={<Landmark className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Construction className="mr-2 h-5 w-5 text-amber-500" />
            Em Construção
          </CardTitle>
          <CardDescription>
            Esta calculadora de juros está em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve, você poderá calcular juros simples e compostos aqui.
          </p>
          <div className="mt-6 flex justify-center">
            <Landmark className="h-24 w-24 text-muted-foreground/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
