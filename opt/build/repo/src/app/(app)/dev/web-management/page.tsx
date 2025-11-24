// src/app/(app)/dev/web-management/page.tsx
"use client";

import { useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function WebManagementPage() {
  useEffect(() => {
    document.title = `Gestão Web - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Gestão Web"
        description="Gerencie os custos de seus domínios, hospedagens, VPS e outras assinaturas."
        icon={<Globe className="h-6 w-6 text-primary" />}
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
            Esta ferramenta para gerenciar os custos de seus ativos web estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
