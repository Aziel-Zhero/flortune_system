// src/app/(app)/dev/kanban-analytics/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, BarChart, Clock, ListTodo, MoveRight, Workflow } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Line, Area as AreaRecharts, AreaChart as AreaChartRecharts, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";

// Mock Data para Métricas Kanban
const throughputData = [
  { week: "Semana 26", tasks: 5 },
  { week: "Semana 27", tasks: 7 },
  { week: "Semana 28", tasks: 6 },
  { week: "Semana 29", tasks: 8 },
  { week: "Semana 30", tasks: 7 },
];
const throughputChartConfig = { tasks: { label: "Tarefas Concluídas", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

const cycleTimeData = [
    { task: "Task-101", "Cycle Time": 2, "Lead Time": 3 },
    { task: "Task-102", "Cycle Time": 3, "Lead Time": 4 },
    { task: "Task-103", "Cycle Time": 1, "Lead Time": 2 },
    { task: "Task-104", "Cycle Time": 4, "Lead Time": 5 },
    { task: "Task-105", "Cycle Time": 2.5, "Lead Time": 3.5 },
];
const cycleTimeChartConfig = {
    "Cycle Time": { label: "Cycle Time (dias)", color: "hsl(var(--chart-2))" },
    "Lead Time": { label: "Lead Time (dias)", color: "hsl(var(--chart-3))" }
} satisfies ChartConfig;

const cumulativeFlowData = [
    { date: "01/07", Backlog: 15, "Em Andamento": 3, "Concluído": 20 },
    { date: "02/07", Backlog: 12, "Em Andamento": 5, "Concluído": 21 },
    { date: "03/07", Backlog: 10, "Em Andamento": 6, "Concluído": 22 },
    { date: "04/07", Backlog: 10, "Em Andamento": 5, "Concluído": 23 },
    { date: "05/07", Backlog: 8, "Em Andamento": 4, "Concluído": 26 },
    { date: "08/07", Backlog: 6, "Em Andamento": 5, "Concluído": 27 },
];
const cfdChartConfig = {
    Backlog: { label: "Backlog", color: "hsl(var(--chart-5))" },
    "Em Andamento": { label: "Em Andamento", color: "hsl(var(--chart-2))" },
    Concluído: { label: "Concluído", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export default function KanbanAnalyticsPage() {
  useEffect(() => {
    document.title = `Análise Kanban (DEV) - ${APP_NAME}`;
  }, []);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Análise Kanban (DEV)"
        description="Métricas e insights visuais para otimizar seu fluxo de trabalho contínuo."
        icon={<AreaChart className="h-6 w-6 text-primary" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Work in Progress (WIP)</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><ListTodo className="h-10 w-10 text-primary"/><p className="text-4xl font-bold">5</p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Cycle Time Médio</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><Clock className="h-10 w-10 text-yellow-500"/><p className="text-4xl font-bold">2.5 dias</p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Lead Time Médio</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><MoveRight className="h-10 w-10 text-green-500"/><p className="text-4xl font-bold">3.5 dias</p></CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><BarChart /> Throughput (Vazão)</CardTitle>
              <CardDescription>Tarefas concluídas por semana.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={throughputChartConfig} className="w-full h-64">
                <BarChartRecharts accessibilityLayer data={throughputData}>
                   <CartesianGrid vertical={false} />
                   <XAxis dataKey="week" tickLine={false} tickMargin={10} axisLine={false} />
                   <YAxis />
                   <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                   <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Clock /> Cycle Time vs. Lead Time</CardTitle>
              <CardDescription>Tempo de trabalho ativo vs. tempo total de espera.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={cycleTimeChartConfig} className="w-full h-64">
                    <BarChartRecharts accessibilityLayer data={cycleTimeData}>
                         <CartesianGrid vertical={false} />
                         <XAxis dataKey="task" tickLine={false} axisLine={false} tickMargin={10} />
                         <YAxis label={{ value: 'Dias', angle: -90, position: 'insideLeft' }}/>
                         <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                         <ChartLegend content={<ChartLegendContent />} />
                         <Bar dataKey="Lead Time" fill="var(--color-Lead-Time)" radius={4} />
                         <Bar dataKey="Cycle Time" fill="var(--color-Cycle-Time)" radius={4} />
                    </BarChartRecharts>
                </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Workflow /> Diagrama de Fluxo Cumulativo (CFD)</CardTitle>
              <CardDescription>Visualização do trabalho em cada etapa ao longo do tempo.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cfdChartConfig} className="w-full h-80">
                  <AreaChartRecharts accessibilityLayer data={cumulativeFlowData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10}/>
                      <YAxis label={{ value: 'Nº de Tarefas', angle: -90, position: 'insideLeft' }}/>
                      <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <AreaRecharts dataKey="Backlog" type="monotone" fill="var(--color-Backlog)" fillOpacity={0.6} stroke="var(--color-Backlog)" stackId="a" />
                      <AreaRecharts dataKey="Em Andamento" type="monotone" fill="var(--color-Em-Andamento)" fillOpacity={0.6} stroke="var(--color-Em-Andamento)" stackId="a" />
                      <AreaRecharts dataKey="Concluído" type="monotone" fill="var(--color-Concluído)" fillOpacity={0.6} stroke="var(--color-Concluído)" stackId="a" />
                  </AreaChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
