// src/app/(app)/corporate/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { AreaChart, Clock, ListChecks, CheckCircle, GitCommit, Workflow } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart as AreaChartRecharts, Line, LineChart as LineChartRecharts, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { motion } from "framer-motion";

const burndownData = [
  { day: "Dia 1", ideal: 50, real: 50 }, { day: "Dia 2", ideal: 45, real: 48 },
  { day: "Dia 3", ideal: 40, real: 42 }, { day: "Dia 4", ideal: 35, real: 38 },
  { day: "Dia 5", ideal: 30, real: 30 }, { day: "Dia 6", ideal: 25, real: 28 },
  { day: "Dia 7", ideal: 20, real: 22 }, { day: "Dia 8", ideal: 15, real: 15 },
  { day: "Dia 9", ideal: 10, real: 8 }, { day: "Dia 10", ideal: 5, real: 3 },
  { day: "Dia 11", ideal: 0, real: 0 },
];
const burndownChartConfig = {
  ideal: { label: "Ideal", color: "hsl(var(--muted-foreground) / 0.5)" },
  real: { label: "Real", color: "hsl(var(--chart-1))" }
} satisfies ChartConfig;

const cfdData = [
    { week: "1", backlog: 35, doing: 25, review: 12, done: 5 }, { week: "2", backlog: 42, doing: 35, review: 20, done: 10 },
    { week: "3", backlog: 55, doing: 45, review: 28, done: 15 }, { week: "4", backlog: 60, doing: 52, review: 35, done: 22 },
    { week: "5", backlog: 68, doing: 60, review: 42, done: 28 }, { week: "6", backlog: 75, doing: 68, review: 50, done: 35 },
];
const cfdChartConfig = {
    done: { label: "Pronto", color: "hsl(var(--chart-2))" },
    review: { label: "Revisão", color: "hsl(var(--chart-3))" },
    doing: { label: "Em Andamento", color: "hsl(var(--chart-1))" },
    backlog: { label: "Backlog", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const recentActivities = [
    { id: 1, user: "Bruno Costa", action: "finalizou a tarefa", subject: "API de Autenticação", time: "15 min atrás", icon: CheckCircle },
    { id: 2, user: "Carla Dias", action: "moveu para Revisão", subject: "Componente de Gráfico", time: "1 hora atrás", icon: GitCommit },
    { id: 3, user: "Daniel Alves", action: "iniciou a tarefa", subject: "Design da Landing Page V2", time: "3 horas atrás", icon: GitCommit },
];

export default function CorporateReportsPage() {
  useEffect(() => {
    document.title = `Relatórios Corporativos - ${APP_NAME}`;
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring", stiffness: 100 } }),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gráficos & Metas Corporativas"
        description="Visualize o desempenho da sua empresa, acompanhe metas e gere relatórios."
        icon={<AreaChart className="h-6 w-6 text-primary" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card><CardHeader><CardTitle>Dias na Sprint</CardTitle></CardHeader><CardContent className="flex items-center gap-4"><Clock className="h-8 w-8 text-primary" /><p className="text-3xl font-bold">7 / 15</p></CardContent></Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card><CardHeader><CardTitle>Tarefas da Sprint</CardTitle></CardHeader><CardContent className="flex items-center gap-4"><ListChecks className="h-8 w-8 text-green-500" /><p className="text-3xl font-bold">28 / 40</p></CardContent></Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card><CardHeader><CardTitle>Impedimentos Ativos</CardTitle></CardHeader><CardContent className="flex items-center gap-4"><AlertTriangle className="h-8 w-8 text-destructive" /><p className="text-3xl font-bold">2</p></CardContent></Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle className="font-headline flex items-center gap-2">Burndown da Sprint</CardTitle><CardDescription>Acompanhe o progresso do trabalho restante versus o ideal.</CardDescription></CardHeader>
            <CardContent className="h-80">
              <ChartContainer config={burndownChartConfig} className="w-full h-full">
                <LineChartRecharts accessibilityLayer data={burndownData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis label={{ value: 'Pontos', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line dataKey="ideal" type="monotone" stroke="var(--color-ideal)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line dataKey="real" type="monotone" stroke="var(--color-real)" strokeWidth={2} dot={{ fill: "var(--color-real)"}} />
                </LineChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
            <Card>
                <CardHeader><CardTitle className="font-headline">Atividades Recentes</CardTitle></CardHeader>
                <CardContent className="space-y-4 h-80 overflow-y-auto">
                    {recentActivities.map(act => {
                        const Icon = act.icon;
                        return (
                            <div key={act.id} className="flex items-start gap-3">
                                <Icon className="h-4 w-4 mt-1 text-muted-foreground"/>
                                <div>
                                    <p className="text-sm"><span className="font-semibold">{act.user}</span> {act.action} <span className="font-semibold text-primary">"{act.subject}"</span>.</p>
                                    <p className="text-xs text-muted-foreground">{act.time}</p>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </motion.div>
         <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-5">
           <Card>
            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Workflow /> Diagrama de Fluxo Cumulativo (CFD)</CardTitle><CardDescription>Analise o fluxo de trabalho e identifique gargalos (dados de exemplo).</CardDescription></CardHeader>
            <CardContent className="h-96">
               <ChartContainer config={cfdChartConfig} className="w-full h-full">
                  <AreaChartRecharts accessibilityLayer data={cfdData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="week" name="Semana" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(val) => `Semana ${val}`}/>
                      <YAxis label={{ value: 'Nº de Itens', angle: -90, position: 'insideLeft' }}/>
                      <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area dataKey="done" type="natural" fill="hsl(var(--chart-2))" stroke="hsl(var(--chart-2))" stackId="a" />
                      <Area dataKey="review" type="natural" fill="hsl(var(--chart-3))" stroke="hsl(var(--chart-3))" stackId="a" />
                      <Area dataKey="doing" type="natural" fill="hsl(var(--chart-1))" stroke="hsl(var(--chart-1))" stackId="a" />
                      <Area dataKey="backlog" type="natural" fill="hsl(var(--chart-5))" stroke="hsl(var(--chart-5))" stackId="a" />
                  </AreaChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
