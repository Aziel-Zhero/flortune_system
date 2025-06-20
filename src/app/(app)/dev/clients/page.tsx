
// src/app/(app)/dev/clients/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2 } from "lucide-react"; // Ícone para Clientes
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function DevClientsPage() {
  useEffect(() => {
    document.title = `Clientes (DEV) - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Clientes (DEV)"
        description="Página de desenvolvimento para gerenciamento de clientes."
        icon={<Users2 className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Conteúdo de Clientes</CardTitle>
          <CardDescription>
            Esta é uma página placeholder para a seção de Clientes em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Funcionalidades relacionadas a clientes serão implementadas aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    