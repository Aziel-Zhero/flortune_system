// src/app/(admin)/admin/marketing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Mail, LineChart, Users, Target, PlusCircle } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Marketing & Vendas"
        icon={<Megaphone />}
        description="Gerencie campanhas, analise o funil de conversão e engaje seus usuários."
        actions={<Button><PlusCircle className="mr-2 h-4 w-4" /> Nova Campanha</Button>}
      />

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Visitantes Únicos (Mês)</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">12,450</div><p className="text-xs text-muted-foreground">+15.2% vs. mês anterior</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Leads Gerados (Mês)</CardTitle><Mail className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">870</div><p className="text-xs text-muted-foreground">+8.1% vs. mês anterior</p></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Taxa de Conversão (Lead)</CardTitle><Target className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">6.9%</div><p className="text-xs text-muted-foreground">-0.5% vs. mês anterior</p></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Custo por Aquisição (CAC)</CardTitle><LineChart className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">R$ 12,50</div><p className="text-xs text-muted-foreground">Média dos últimos 30 dias</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Visão geral das etapas de conversão do usuário, desde a visita até a assinatura.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground"> (Placeholder para gráfico de funil) </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Campanhas Ativas</CardTitle>
                <CardDescription>Gerencie e acompanhe o desempenho das suas campanhas de marketing atuais.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground"> (Placeholder para lista de campanhas) </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
