// src/app/(app)/dev/kanban-analytics/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, BarChart, Clock, ListTodo, MoveRight, Workflow, AlertTriangle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Area as AreaRecharts, AreaChart as AreaChartRecharts, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface Task {
  id: string;
  columnId: string;
}

interface Column {
  id: string;
  name: string;
}

export default function KanbanAnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    document.title = `Análise Kanban (DEV) - ${APP_NAME}`;
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
    const dataByColumn = columns.map(column => {
        const columnTasks = tasks.filter(task => task.columnId === column.id);
        return {
            name: column.name,
            tasks: columnTasks.length
        };
    });

    const wipColumns = ['doing', 'in_progress', 'review', 'test'];
    const wipTasksCount = tasks.filter(task => wipColumns.includes(task.columnId)).length;
    const doneTasksCount = tasks.filter(task => task.columnId === 'done').length;

    return {
        distribution: dataByColumn,
        wipCount: wipTasksCount,
        throughput: doneTasksCount,
    };
  }, [tasks, columns]);
  
  const distributionChartConfig = { tasks: { label: "Nº de Tarefas", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Work in Progress (WIP)</CardTitle><CardDescription>Tarefas atualmente em andamento.</CardDescription></CardHeader>
                <CardContent className="flex items-center gap-4"><ListTodo className="h-10 w-10 text-primary"/><p className="text-4xl font-bold">{analyticsData.wipCount}</p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Throughput (Vazão)</CardTitle><CardDescription>Total de tarefas concluídas.</CardDescription></CardHeader>
                <CardContent className="flex items-center gap-4"><MoveRight className="h-10 w-10 text-green-500"/><p className="text-4xl font-bold">{analyticsData.throughput}</p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Cycle Time Médio</CardTitle><CardDescription>(Em desenvolvimento)</CardDescription></CardHeader>
                <CardContent className="flex items-center gap-4"><Clock className="h-10 w-10 text-yellow-500"/><p className="text-4xl font-bold">N/A</p></CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><BarChart /> Distribuição de Tarefas por Coluna</CardTitle>
              <CardDescription>Visão geral de onde o trabalho se concentra no seu fluxo.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={distributionChartConfig} className="w-full h-72">
                <BarChartRecharts accessibilityLayer data={analyticsData.distribution}>
                   <CartesianGrid vertical={false} />
                   <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                   <YAxis />
                   <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                   <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Workflow /> Diagrama de Fluxo Cumulativo (CFD)</CardTitle>
              <CardDescription>Visualização do trabalho em cada etapa ao longo do tempo (Em desenvolvimento).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80 flex items-center justify-center bg-muted/50 rounded-md">
                <p className="text-muted-foreground">Gráfico CFD em breve.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
