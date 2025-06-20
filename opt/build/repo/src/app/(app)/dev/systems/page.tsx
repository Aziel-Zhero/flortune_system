
// src/app/(app)/dev/systems/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Component } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function DevSystemsPage() {
  useEffect(() => {
    document.title = `Sistemas (DEV) - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Sistemas (DEV)"
        description="Página de desenvolvimento para gerenciamento de sistemas."
        icon={<Component className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Conteúdo de Sistemas</CardTitle>
          <CardDescription>
            Esta é uma página placeholder para a seção de Sistemas em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Funcionalidades e informações relacionadas a sistemas serão implementadas aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
    