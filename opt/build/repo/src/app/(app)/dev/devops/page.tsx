
// src/app/(app)/dev/devops/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitMerge } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function DevDevOpsPage() {
  useEffect(() => {
    document.title = `DevOps (DEV) - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="DevOps (DEV)"
        description="Página de desenvolvimento para práticas e ferramentas de DevOps."
        icon={<GitMerge className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Conteúdo de DevOps</CardTitle>
          <CardDescription>
            Esta é uma página placeholder para a seção de DevOps em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Funcionalidades e informações sobre DevOps serão implementadas aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
