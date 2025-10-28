// src/app/(app)/dev/kanban-analytics/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AreaChart, BarChart, Clock, ListTodo, MoveRight, Workflow, AlertTriangle, DollarSign, Puzzle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, LabelList, Area as AreaRecharts, AreaChart as AreaChartRecharts, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ResponsiveContainer, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { PrivateValue } from "@/components/shared/private-value";

interface Task {
  id: string;
  columnId: string;
  value?: number;
  points?: number;
}

interface Column {
  id: string;
  name: string;
  wipLimit?: number;
}

// --- MOCK DATA ---
const mockCumulativeFlowData = [
    // Semana, Pronto (base), Revisao (Pronto + Revisao), Implementacao (Pronto + Revisao + Impl), Especificacao (Total)
    { week: "1", Pronto: 5, Revisão: 12, Implementação: 25, Especificação: 35 },
    { week: "2", Pronto: 10, Revisão: 20, Implementação: 35, Especificação: 42 },
    { week: "3", Pronto: 15, Revisão: 28, Implementação: 45, Especificação: 55 },
    { week: "4", Pronto: 22, Revisão: 35, Implementação: 52, Especificação: 60 },
    { week: "5", Pronto: 28, Revisão: 42, Implementação: 60, Especificação: 68 },
    { week: "6", Pronto: 35, Revisão: 50, Implementação: 68, Especificação: 75 },
    { week: "7", Pronto: 45, Revisão: 60, Implementação: 75, Especificação: 85 },
    { week: "8", Pronto: 55, Revisão: 70, Implementação: 82, Especificação: 95 },
    { week: "9", Pronto: 68, Revisão: 80, Implementação: 90, Especificação: 105 },
    { week: "10", Pronto: 85, Revisão: 95, Implementação: 105, Especificação: 120 },
];
const cfdChartConfig = {
    Pronto: { label: "Pronto", color: "hsl(var(--chart-4))" },
    Revisão: { label: "Revisão", color: "hsl(var(--chart-5))" },
    Implementação: { label: "Implementação", color: "hsl(var(--chart-2))" },
    Especificação: { label: "Especificação", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;


export default function KanbanAnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    document.title = `Análise Kanban - ${APP_NAME}`;
    setIsClient(true);
    try {
      const storedTasks = localStorage.getItem('kanban-tasks');
      const storedColumns = localStorage.getItem('kanban-columns');
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedColumns) setColumns(JSON.parse(storedColumns));
    } catch (e) {
      console.error("Failed to load Kanban data from localStorage", e);
    }
  }, []);

  const analyticsData = useMemo(() => {
    if (!columns.length) return {
        distribution: [], wipCount: 0, wipValue: 0, wipPoints: 0, throughput: 0
    };
    
    const wipColumnIds = columns.filter(c => c.name.toLowerCase().includes('andamento') || c.name.toLowerCase().includes('doing')).map(c => c.id);
    const doneColumnIds = columns.filter(c => c.name.toLowerCase().includes('concluído') || c.name.toLowerCase().includes('done')).map(c => c.id);

    const dataByColumn = columns.map(column => {
        const columnTasks = tasks.filter(task => task.columnId === column.id);
        return {
            name: column.name,
            tasks: columnTasks.length,
            value: columnTasks.reduce((sum, task) => sum + (task.value || 0), 0),
            points: columnTasks.reduce((sum, task) => sum + (task.points || 0), 0),
        };
    });

    const wipTasks = tasks.filter(task => wipColumnIds.includes(task.columnId));
    const doneTasks = tasks.filter(task => doneColumnIds.includes(task.columnId));

    return {
        distribution: dataByColumn,
        wipCount: wipTasks.length,
        wipValue: wipTasks.reduce((sum, task) => sum + (task.value || 0), 0),
        wipPoints: wipTasks.reduce((sum, task) => sum + (task.points || 0), 0),
        throughput: doneTasks.length,
    };
  }, [tasks, columns]);
  
  const tasksChartConfig = { tasks: { label: "Tarefas", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
  const valueChartConfig = { value: { label: "Valor (R$)", color: "hsl(var(--chart-2))" } } satisfies ChartConfig;
  const pointsChartConfig = useMemo(() => {
      const config: ChartConfig = { points: { label: "Story Points" }};
      analyticsData.distribution.forEach((col, i) => {
          config[col.name] = {
              label: col.name,
              color: `hsl(var(--chart-${(i % 5) + 1}))`
          }
      });
      return config;
  }, [analyticsData.distribution]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  if (!isClient) {
    return null; // Render nothing on the server
  }
  
  if (tasks.length === 0 && columns.length === 0) {
    return (
       <div className="space-y-8">
         <PageHeader
            title="Análise Kanban"
            description="Métricas e insights visuais para otimizar seu fluxo de trabalho contínuo."
            icon={<AreaChart className="h-6 w-6 text-primary" />}
          />
          <Card className="text-center py-12 border-dashed">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                <CardTitle className="mt-4">Nenhum Dado para Analisar</CardTitle>
                <CardDescription>
                    Adicione tarefas ao seu <a href="/dev/kanban" className="underline text-primary">Quadro Kanban</a> para ver as métricas.
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Análise Kanban"
        description="Métricas e insights visuais para otimizar seu fluxo de trabalho contínuo."
        icon={<AreaChart className="h-6 w-6 text-primary" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Tarefas em Andamento (WIP)</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><ListTodo className="h-10 w-10 text-primary"/><p className="text-4xl font-bold">{analyticsData.wipCount}</p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Valor em Andamento (R$)</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><DollarSign className="h-10 w-10 text-green-500"/><p className="text-3xl font-bold"><PrivateValue value={analyticsData.wipValue.toLocaleString('pt-BR')} /></p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Pontos em Andamento</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><Puzzle className="h-10 w-10 text-yellow-500"/><p className="text-4xl font-bold">{analyticsData.wipPoints}</p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Throughput (Vazão)</CardTitle><CardDescription className="text-xs">Tarefas concluídas</CardDescription></CardHeader>
                <CardContent className="flex items-center gap-4"><MoveRight className="h-10 w-10 text-blue-500"/><p className="text-4xl font-bold">{analyticsData.throughput}</p></CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><BarChart /> Distribuição de Tarefas</CardTitle>
              <CardDescription>Nº de tarefas em cada coluna do fluxo.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={tasksChartConfig} className="w-full h-72">
                  <BarChartRecharts accessibilityLayer data={analyticsData.distribution} margin={{ top: 20 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)}/>
                      <RechartsTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Bar dataKey="tasks" fill="var(--color-tasks)" radius={8}>
                          <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
                      </Bar>
                  </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><DollarSign /> Distribuição de Valor</CardTitle>
              <CardDescription>Valor agregado (R$) em cada etapa.</CardDescription>
            </CardHeader>
            <CardContent>
               <ChartContainer config={valueChartConfig} className="w-full h-72">
                  <BarChartRecharts accessibilityLayer data={analyticsData.distribution} layout="vertical" margin={{ right: 16 }}>
                      <CartesianGrid horizontal={false} />
                      <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
                      <XAxis dataKey="value" type="number" hide />
                      <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                      <Bar dataKey="value" layout="vertical" fill="var(--color-value)" radius={4}>
                         <LabelList dataKey="name" position="insideLeft" offset={8} className="fill-background" fontSize={12} />
                         <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value: number) => new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                      </Bar>
                  </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Puzzle /> Distribuição de Esforço</CardTitle>
              <CardDescription>Story Points distribuídos pelo fluxo.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer config={pointsChartConfig} className="mx-auto aspect-square max-h-[250px]">
                    <PieChart>
                      <RechartsTooltip cursor={true} content={<ChartTooltipContent hideLabel />} />
                      <Pie data={analyticsData.distribution} dataKey="points" nameKey="name" innerRadius={60} strokeWidth={5}>
                         {analyticsData.distribution.map((entry) => (
                          <Sector key={`cell-${entry.name}`} fill={`var(--color-${entry.name})`} />
                        ))}
                      </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm mt-auto">
               <div className="text-muted-foreground leading-none">
                Total de {analyticsData.distribution.reduce((acc, curr) => acc + curr.points, 0)} pontos distribuídos.
              </div>
            </CardFooter>
          </Card>
        </motion.div>
        <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Workflow /> Diagrama de Fluxo Cumulativo (CFD)</CardTitle>
              <CardDescription>Visualização do trabalho em cada etapa ao longo do tempo (com dados de exemplo).</CardDescription>
            </CardHeader>
            <CardContent>
               <ChartContainer config={cfdChartConfig} className="w-full h-80">
                  <AreaChartRecharts accessibilityLayer data={mockCumulativeFlowData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="week" name="Semana" tickLine={false} axisLine={false} tickMargin={10}/>
                      <YAxis label={{ value: 'Histórias', angle: -90, position: 'insideLeft' }}/>
                      <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <defs>
                        <linearGradient id="fillEspecificacao" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-Especificação)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-Especificação)" stopOpacity={0.1}/></linearGradient>
                        <linearGradient id="fillImplementacao" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-Implementação)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-Implementação)" stopOpacity={0.1}/></linearGradient>
                        <linearGradient id="fillRevisao" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-Revisão)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-Revisão)" stopOpacity={0.1}/></linearGradient>
                         <linearGradient id="fillPronto" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-Pronto)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-Pronto)" stopOpacity={0.1}/></linearGradient>
                      </defs>
                      <AreaRecharts dataKey="Especificação" type="natural" fill="url(#fillEspecificacao)" stroke="var(--color-Especificação)" stackId="a" />
                      <AreaRecharts dataKey="Implementação" type="natural" fill="url(#fillImplementacao)" stroke="var(--color-Implementação)" stackId="a" />
                      <AreaRecharts dataKey="Revisão" type="natural" fill="url(#fillRevisao)" stroke="var(--color-Revisão)" stackId="a" />
                      <AreaRecharts dataKey="Pronto" type="natural" fill="url(#fillPronto)" stroke="var(--color-Pronto)" stackId="a" />
                  </AreaChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
