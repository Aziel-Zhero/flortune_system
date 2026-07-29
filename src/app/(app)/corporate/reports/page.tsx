"use client";

import { useEffect } from "react";
import { AreaChart, Users } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CorporateReportsPage() {
  useEffect(() => { document.title = `Relatórios Corporativos - ${APP_NAME}`; }, []);

  return <div className="space-y-6 sm:space-y-8">
    <PageHeader title="Gráficos e metas corporativas" description="Acompanhe a produtividade quando os dados da equipe estiverem disponíveis." icon={<AreaChart className="h-6 w-6 text-primary" />} />
    <Card className="border-dashed"><CardHeader className="items-center text-center"><Users className="h-10 w-10 text-muted-foreground" /><CardTitle>Dados corporativos indisponíveis</CardTitle><CardDescription className="max-w-md">Não há dados simulados neste relatório. Conecte as atividades e membros da sua equipe para habilitar os gráficos e indicadores.</CardDescription></CardHeader><CardContent /></Card>
  </div>;
}
