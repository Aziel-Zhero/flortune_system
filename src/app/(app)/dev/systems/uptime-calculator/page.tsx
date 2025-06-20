
// src/app/(app)/dev/systems/uptime-calculator/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function UptimeCalculatorPage() {
  useEffect(() => {
    document.title = `Calculadora de Uptime - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Calculadora de Uptime (SLA)"
        description="Calcule o tempo de inatividade permitido com base em uma porcentagem de SLA."
        icon={<Gauge className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Construction className="mr-2 h-5 w-5 text-amber-500" />
            Em Construção
            </CardTitle>
          <CardDescription>
            Esta calculadora de uptime está em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve, você poderá calcular o tempo de downtime correspondente a um SLA aqui.
          </p>
          <div className="mt-6 flex justify-center">
            <Gauge className="h-24 w-24 text-muted-foreground/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
