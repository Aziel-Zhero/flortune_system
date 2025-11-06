// src/app/(admin)/admin/apis/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

type ApiStatus = 'operational' | 'degraded' | 'down';

interface ApiService {
  id: 'weather' | 'quotes';
  name: string;
  description: string;
  status: ApiStatus;
  lastChecked: string;
}

const initialApiServices: ApiService[] = [
  { id: 'weather', name: 'OpenWeatherMap', description: 'API de Clima e Tempo', status: 'operational', lastChecked: 'N/A' },
  { id: 'quotes', name: 'AwesomeAPI/ExchangeRate', description: 'API de Cotações de Moeda', status: 'operational', lastChecked: 'N/A' },
];

export default function ApisPage() {
  const [apiServices, setApiServices] = useState<ApiService[]>(initialApiServices);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Status das APIs - ${APP_NAME}`;
  }, []);
  
  const handleTestApi = async (apiId: 'weather' | 'quotes') => {
    setTestingId(apiId);
    
    // Simulação de chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const isSuccess = Math.random() > 0.15; // 85% de chance de sucesso
    
    setApiServices(prev => prev.map(api => 
      api.id === apiId 
        ? { ...api, status: isSuccess ? 'operational' : 'down', lastChecked: new Date().toLocaleTimeString('pt-BR') }
        : api
    ));
    
    toast({
      title: `Teste da API ${apiId === 'weather' ? 'de Clima' : 'de Cotações'}`,
      description: isSuccess ? 'A API respondeu com sucesso.' : 'Falha ao contatar a API.',
      variant: isSuccess ? 'default' : 'destructive'
    });

    setTestingId(null);
  };
  
  const getStatusBadge = (status: ApiStatus) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3"/>Funcionando</Badge>;
      case 'degraded':
        return <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600"><AlertCircle className="mr-1 h-3 w-3"/>Degradado</Badge>;
      case 'down':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3"/>Fora do Ar</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Status das APIs Externas"
        icon={<Code />}
        description="Monitore a saúde e a disponibilidade das APIs que o Flortune utiliza."
      />
      <Card>
        <CardHeader>
          <CardTitle>Serviços Integrados</CardTitle>
          <CardDescription>Verifique o status atual de cada serviço e execute testes manuais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Verificação</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiServices.map(api => (
                <TableRow key={api.id}>
                  <TableCell className="font-semibold">{api.name}</TableCell>
                  <TableCell>{api.description}</TableCell>
                  <TableCell>{getStatusBadge(api.status)}</TableCell>
                  <TableCell>{api.lastChecked}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestApi(api.id)}
                      disabled={testingId === api.id}
                    >
                      {testingId === api.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {testingId === api.id ? 'Testando...' : 'Testar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
