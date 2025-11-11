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
            <CardContent><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">Dados indisponíveis</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Leads Gerados (Mês)</CardTitle><Mail className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">Dados indisponíveis</p></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Taxa de Conversão (Lead)</CardTitle><Target className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">Dados indisponíveis</p></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Custo por Aquisição (CAC)</CardTitle><LineChart className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">Dados indisponíveis</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Visão geral das etapas de conversão do usuário, desde a visita até a assinatura.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Nenhum dado para exibir o funil.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Campanhas Ativas</CardTitle>
                <CardDescription>Gerencie e acompanhe o desempenho das suas campanhas de marketing atuais.</CardDescription>
            </CardHeader>
             <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Nenhuma campanha ativa.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
