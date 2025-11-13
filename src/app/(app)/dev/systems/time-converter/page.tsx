// src/app/(app)/dev/systems/time-converter/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClockIcon, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TimeConverterPage() {
  useEffect(() => {
    document.title = `Conversor de Tempo - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Conversor de Tempo"
        description="Converta facilmente entre diferentes unidades de tempo."
        icon={<ClockIcon className="h-6 w-6 text-primary" />}
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
            Esta ferramenta para converter unidades de tempo estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
