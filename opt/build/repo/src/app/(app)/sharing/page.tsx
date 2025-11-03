// src/app/(app)/sharing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Share2, Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";

export default function SharingPage() {
  useEffect(() => {
    document.title = `Compartilhamento - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Compartilhamento de Módulos"
        description="Gerencie com quem você compartilha seus dados financeiros."
        icon={<Share2 className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Construction className="mr-2 h-5 w-5 text-amber-500" />
            Em Construção
          </CardTitle>
          <CardDescription>
            Funcionalidade de compartilhamento de módulos financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve, você poderá compartilhar seletivamente seus orçamentos, metas ou transações com familiares, contadores ou consultores financeiros, com controle total sobre as permissões de visualização e edição.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
