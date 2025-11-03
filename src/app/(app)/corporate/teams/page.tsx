// src/app/(app)/corporate/teams/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, FileDown, TrendingUp, Briefcase, ListChecks, BarChart } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, AreaChart as AreaChartRecharts, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { PrivateValue } from "@/components/shared/private-value";

const teamMembers = [
  { id: 'usr_1', name: 'Ana Silva', role: 'Gerente de Projetos', avatar: 'https://placehold.co/40x40/a2d2ff/333?text=AS', activeProjects: 3, lastActivity: '2 horas atrás', taskProgress: 85 },
  { id: 'usr_2', name: 'Bruno Costa', role: 'Desenvolvedor Sênior', avatar: 'https://placehold.co/40x40/bde0fe/333?text=BC', activeProjects: 2, lastActivity: '30 minutos atrás', taskProgress: 95 },
  { id: 'usr_3', name: 'Carla Dias', role: 'Desenvolvedora Pleno', avatar: 'https://placehold.co/40x40/ffafcc/333?text=CD', activeProjects: 2, lastActivity: '5 horas atrás', taskProgress: 70 },
  { id: 'usr_4', name: 'Daniel Alves', role: 'UX/UI Designer', avatar: 'https://placehold.co/40x40/caffbf/333?text=DA', activeProjects: 4, lastActivity: 'Ontem', taskProgress: 90 },
  { id: 'usr_5', name: 'Eduarda Lima', role: 'Estagiária', avatar: 'https://placehold.co/40x40/ffc8dd/333?text=EL', activeProjects: 1, lastActivity: 'Hoje', taskProgress: 60 },
];

const teamPerformanceData = [
  { month: 'Jan', tasks: 45, value: 50000 },
  { month: 'Fev', tasks: 52, value: 65000 },
  { month: 'Mar', tasks: 60, value: 72000 },
  { month: 'Abr', tasks: 55, value: 68000 },
  { month: 'Mai', tasks: 65, value: 85000 },
  { month: 'Jun', tasks: 72, value: 95000 },
];

export default function TeamsPage() {
  useEffect(() => {
    document.title = `Gestão de Equipes - ${APP_NAME}`;
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestão de Equipes"
        description="Gerencie membros da equipe, acompanhe a performance e atribua projetos."
        icon={<Users className="h-6 w-6 text-primary" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Gerar Relatório</Button>
            <Button><UserPlus className="mr-2 h-4 w-4"/>Adicionar Membro</Button>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardHeader><CardTitle className="font-headline text-lg">Membros Ativos</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4"><Users className="h-8 w-8 text-primary"/><p className="text-3xl font-bold">5 / 5</p></CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle className="font-headline text-lg">Projetos em Andamento</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4"><Briefcase className="h-8 w-8 text-blue-500"/><p className="text-3xl font-bold">8</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="font-headline text-lg">Tarefas Concluídas</CardTitle><CardDescription className="text-xs">Este mês</CardDescription></CardHeader>
            <CardContent className="flex items-center gap-4"><ListChecks className="h-8 w-8 text-green-500"/><p className="text-3xl font-bold">128</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="font-headline text-lg">Faturamento da Equipe</CardTitle><CardDescription className="text-xs">Este mês</CardDescription></CardHeader>
            <CardContent className="flex items-center gap-4"><TrendingUp className="h-8 w-8 text-emerald-500"/><p className="text-3xl font-bold"><PrivateValue value={'R$ 95.000'}/></p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-headline">Membros da Equipe</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Projetos Ativos</TableHead>
                <TableHead>Progresso de Tarefas</TableHead>
                <TableHead>Última Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarImage src={member.avatar} data-ai-hint="user avatar" /><AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{member.activeProjects}</Badge></TableCell>
                  <TableCell><Progress value={member.taskProgress} className="h-2" /></TableCell>
                  <TableCell className="text-muted-foreground">{member.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary"/>
            Performance da Equipe (Tarefas Concluídas)
          </CardTitle>
          <CardDescription>Visualização da produtividade e valor gerado pela equipe ao longo do tempo.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{tasks: {label: "Tarefas"}, value: {label: "Valor (R$)"}}} className="w-full h-80">
            <AreaChartRecharts accessibilityLayer data={teamPerformanceData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis yAxisId="left" tickFormatter={(value) => `${value}`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `R$${(value / 1000)}k`} />
              <RechartsTooltip 
                cursor={false} 
                content={<ChartTooltipContent 
                    formatter={(value, name) => (name === "tasks" ? `${value} tarefas` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number))} 
                    indicator="dot" 
                />} 
              />
              <ChartLegend content={<ChartLegendContent />} />
              <defs>
                 <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} /><stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} /></linearGradient>
                 <linearGradient id="fillTasks" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} /></linearGradient>
              </defs>
              <Area yAxisId="right" dataKey="value" type="natural" fill="url(#fillValue)" stroke="hsl(var(--chart-2))" stackId="a" name="Valor Gerado"/>
              <Area yAxisId="left" dataKey="tasks" type="natural" fill="url(#fillTasks)" stroke="hsl(var(--chart-1))" stackId="b" name="Tarefas Concluídas"/>
            </AreaChartRecharts>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}
