"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AreaChart, DatabaseZap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DevDashboardPage() {
  useEffect(() => {
    document.title = `Dashboard DEV - ${APP_NAME}`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard do Desenvolvedor"
        description="Acompanhe os indicadores dos seus projetos quando uma fonte de dados estiver conectada."
        icon={<AreaChart className="h-6 w-6 text-primary" />}
      />
      <Card className="border-dashed">
        <CardHeader className="items-center text-center">
          <DatabaseZap className="h-10 w-10 text-muted-foreground" />
          <CardTitle>Nenhum dado de projeto disponível</CardTitle>
          <CardDescription className="max-w-md">
            Este painel não exibe estimativas ou valores de exemplo. Conecte ou registre os dados dos seus projetos para visualizar os indicadores aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild><Link href="/dev/clients">Gerenciar clientes e projetos</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
