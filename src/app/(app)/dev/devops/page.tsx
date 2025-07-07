// src/app/(app)/dev/devops/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitMerge, CheckCircle, Clock, Server, AlertCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const deploymentHistory = [
    { id: 'dpl_1', commit: 'feat: add kanban board', status: 'Success', duration: '1m 32s', date: '2024-07-25 14:30 UTC' },
    { id: 'dpl_2', commit: 'fix: aPI auth issue', status: 'Success', duration: '1m 15s', date: '2024-07-25 10:15 UTC' },
    { id: 'dpl_3', commit: 'refactor: state management', status: 'Failed', duration: '45s', date: '2024-07-24 18:00 UTC' },
];

export default function DevDevOpsPage() {
  useEffect(() => {
    document.title = `DevOps (DEV) - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Painel DevOps (DEV)"
        description="Visão geral do pipeline de CI/CD, status dos serviços e histórico de deployments."
        icon={<GitMerge className="h-6 w-6 text-primary" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Status do Build</CardTitle><CheckCircle className="h-4 w-4 text-green-500"/></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-500">Sucesso</div><p className="text-xs text-muted-foreground">Último build concluído sem erros.</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Status do Deploy</CardTitle><CheckCircle className="h-4 w-4 text-green-500"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">Ativo</div><p className="text-xs text-muted-foreground">Versão mais recente publicada.</p></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Status da API</CardTitle><Server className="h-4 w-4 text-green-500"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">Operacional</div><p className="text-xs text-muted-foreground">100% Uptime (últimas 24h).</p></CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Testes de Cobertura</CardTitle><AlertCircle className="h-4 w-4 text-yellow-500"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">87%</div><p className="text-xs text-muted-foreground">Meta: 90%. Faltando testes no módulo X.</p></CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Histórico de Deployments</CardTitle>
          <CardDescription>
            Últimas builds e deployments realizados no ambiente de produção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deploymentHistory.map(d => (
                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-md">
                    <div>
                        <p className="font-mono text-sm font-medium">{d.commit}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3"/>{d.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{d.duration}</span>
                        <Badge variant={d.status === 'Success' ? 'default' : 'destructive'} className={d.status === 'Success' ? 'bg-green-600' : ''}>{d.status}</Badge>
                    </div>
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
