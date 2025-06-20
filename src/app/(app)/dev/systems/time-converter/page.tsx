
// src/app/(app)/dev/systems/time-converter/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function TimeConverterPage() {
  useEffect(() => {
    document.title = `Conversor de Tempo - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Conversor de Tempo"
        description="Converta entre diferentes unidades de tempo."
        icon={<Clock className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
             <Construction className="mr-2 h-5 w-5 text-amber-500" />
            Em Construção
          </CardTitle>
          <CardDescription>
            Esta calculadora de conversão de tempo está em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve, você poderá converter minutos para horas, dias para semanas, etc., aqui.
          </p>
           <div className="mt-6 flex justify-center">
            <Clock className="h-24 w-24 text-muted-foreground/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
