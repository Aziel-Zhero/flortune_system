// src/app/(app)/dev/systems/valuation/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChartHorizontal, DollarSign, CheckCircle, TrendingUp, Gem, Code, BrainCircuit, Leaf } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { PrivateValue } from "@/components/shared/private-value";

interface ValuationMetric {
  area: string;
  description: string;
  estimatedHours: number;
}

const valuationMetrics: ValuationMetric[] = [
  { area: "Autenticação", description: "Sistema de login/cadastro (email/senha e Google), gestão de sessão JWT, perfil de usuário.", estimatedHours: 40 },
  { area: "Gestão Financeira (Core)", description: "CRUDs completos para Transações, Metas, Orçamentos e Tarefas. Lógica de cálculo e progresso.", estimatedHours: 80 },
  { area: "UI/UX e Componentes", description: "Layout responsivo, múltiplos temas, Modo Privado, componentes ShadCN e de visualização de dados (gráficos).", estimatedHours: 60 },
  { area: "Ferramentas DEV", description: "Módulos de gestão (Clientes, Kanban, Scrum) e calculadoras financeiras/técnicas.", estimatedHours: 70 },
  { area: "Infra & DevOps (Base)", description: "Configuração de build, deploy (Netlify), variáveis de ambiente e schema de banco de dados.", estimatedHours: 25 },
];

const HOURLY_RATE = 100; // Valor/hora médio de um desenvolvedor Pleno (em BRL)

export default function ValuationPage() {
  useEffect(() => {
    document.title = `Análise de Valor do Projeto - ${APP_NAME}`;
  }, []);

  const totalHours = valuationMetrics.reduce((acc, metric) => acc + metric.estimatedHours, 0);
  const estimatedValue = totalHours * HOURLY_RATE;

  return (
    <div>
      <PageHeader
        title="Análise de Valor do Projeto"
        description="Estimativa do valor de mercado do projeto com base nas funcionalidades implementadas e análise de precificação."
        icon={<BarChartHorizontal className="h-6 w-6 text-primary" />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary"/>
              Estimativa de Valor do Projeto (MVP Atual)
            </CardTitle>
            <CardDescription>
              Baseado em horas de desenvolvimento estimadas para replicar as funcionalidades atuais a uma taxa de mercado de R$ {HOURLY_RATE}/hora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {valuationMetrics.map(metric => (
              <div key={metric.area} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                <div>
                  <p className="font-semibold">{metric.area}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
                <Badge variant="secondary">{metric.estimatedHours} horas</Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 bg-primary/5 p-4 rounded-b-lg border-t">
            <div className="w-full flex justify-between font-semibold">
                <span>Total de Horas Estimadas:</span>
                <span>{totalHours} horas</span>
            </div>
             <div className="w-full flex justify-between font-bold text-lg text-primary">
                <span>Valor de Mercado Estimado:</span>
                <span><PrivateValue value={estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} /></span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              * Esta é uma estimativa de custo de desenvolvimento (homem-hora) e não inclui custos de gestão, design, marketing ou o valor intrínseco da marca e da base de usuários.
            </p>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary"/>
              Análise de Precificação e Potencial
            </CardTitle>
            <CardDescription>
              Avaliação da compatibilidade dos preços sugeridos com o mercado e potencial de crescimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-md">
                <h4 className="font-semibold flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-600"/>Plano Cultivador (Grátis)</h4>
                <p className="text-sm text-muted-foreground mt-1">Estratégia 'Freemium' clássica. Perfeito para aquisição de usuários e demonstrar o valor principal do app, com um caminho claro para o upgrade.</p>
                <Badge variant="outline" className="mt-2">Competitivo</Badge>
            </div>
             <div className="p-3 border rounded-md">
                <h4 className="font-semibold flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary"/>Plano Mestre Jardineiro (R$ 14,90/mês)</h4>
                <p className="text-sm text-muted-foreground mt-1">Preço alinhado com o mercado de apps de produtividade e finanças SaaS para pessoa física. O valor é justificado pelas futuras funcionalidades de IA e análises avançadas.</p>
                 <Badge variant="outline" className="mt-2">Alinhado com o Mercado</Badge>
            </div>
             <div className="p-3 border rounded-md">
                <h4 className="font-semibold flex items-center gap-2"><Code className="h-4 w-4 text-purple-600"/>Plano para DEVs (R$ 150/mês)</h4>
                <p className="text-sm text-muted-foreground mt-1">Atende a um nicho B2B (freelancers). O preço é significativamente maior, mas se justifica pelo alto valor agregado das ferramentas de gestão de projetos, que economizam tempo e ajudam a gerar receita.</p>
                 <Badge variant="outline" className="mt-2">Potencial de Alta Margem</Badge>
            </div>
          </CardContent>
           <CardFooter className="flex-col items-start gap-2 bg-muted/30 p-4 rounded-b-lg border-t">
             <h4 className="font-semibold">Próximos Passos para Aumentar o Valor:</h4>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Implementar sistema de pagamento de assinaturas (Stripe).</li>
                <li>Concluir e refinar as funcionalidades de IA (sugestões, categorização).</li>
                <li>Desenvolver um sistema de relatórios exportáveis (PDF, CSV).</li>
                <li>Criar uma API pública para o plano DEV, agregando ainda mais valor.</li>
             </ul>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}
