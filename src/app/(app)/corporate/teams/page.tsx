
// src/app/(app)/corporate/teams/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function TeamsPage() {
  useEffect(() => {
    document.title = `Gestão de Equipes - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Gestão de Equipes"
        description="Gerencie membros da equipe, permissões e grupos."
        icon={<Users className="h-6 w-6 text-primary" />}
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
            Esta funcionalidade para gerenciar suas equipes, adicionar membros e definir permissões de acesso aos módulos corporativos estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
