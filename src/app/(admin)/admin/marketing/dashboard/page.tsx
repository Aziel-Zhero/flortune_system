"use client";

import { useEffect } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketingDashboardPage() {
  useEffect(() => { document.title = "Painel NPS - Flortune"; }, []);

  return <div className="space-y-6 sm:space-y-8">
    <PageHeader title="Painel de Net Promoter Score (NPS)" icon={<Heart className="h-6 w-6 text-primary" />} description="Métricas de satisfação baseadas apenas em feedbacks reais recebidos." />
    <Card className="border-dashed"><CardHeader className="items-center text-center"><MessageSquare className="h-10 w-10 text-muted-foreground" /><CardTitle>Nenhuma resposta NPS disponível</CardTitle><CardDescription className="max-w-md">Este painel não preenche métricas com dados de demonstração. Assim que as respostas forem integradas, os indicadores serão calculados aqui.</CardDescription></CardHeader><CardContent /></Card>
  </div>;
}
