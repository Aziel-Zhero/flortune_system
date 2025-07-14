
// src/app/(app)/dev/scrum-analytics/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, PieChart as PieChartIcon, Flag, Clock, CheckCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Line, Area, AreaChart as AreaChartRecharts, Pie, PieChart as PieChartRecharts, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

// Mock Data
const velocityData = [
  { sprint: "Sprint 1", points: 25 },
  { sprint: "Sprint 2", points: 30 },
  { sprint: "Sprint 3", points: 28 },
  { sprint: "Sprint 4", points: 35 },
  { sprint: "Sprint 5", points: 32 },
];
const velocityChartConfig = { points: { label: "Story Points", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

const burndownData = [
    { day: "Dia 1", ideal: 50, real: 50 },
    { day: "Dia 2", ideal: 45, real: 48 },
    { day: "Dia 3", ideal: 40, real: 42 },
    { day: "Dia 4", ideal: 35, real: 38 },
    { day: "Dia 5", ideal: 30, real: 30 },
    { day: "Dia 6", ideal: 25, real: 28 },
    { day: "Dia 7", ideal: 20, real: 22 },
    { day: "Dia 8", ideal: 15, real: 15 },
    { day: "Dia 9", ideal: 10, real: 8 },
    { day: "Dia 10", ideal: 5, real: 3 },
    { day: "Dia 11", ideal: 0, real: 0 },
];
const burndownChartConfig = {
    ideal: { label: "Ideal", color: "hsl(var(--muted-foreground) / 0.5)" },
    real: { label: "Real", color: "hsl(var(--chart-2))" }
} satisfies ChartConfig;

const participationData = [
  { name: 'Alice (PO)', tasks: 5, fill: "hsl(var(--chart-1))" },
  { name: 'Bruno (SM)', tasks: 3, fill: "hsl(var(--chart-2))" },
  { name: 'Carla (Dev)', tasks: 12, fill: "hsl(var(--chart-3))" },
  { name: 'Daniel (Dev)', tasks: 10, fill: "hsl(var(--chart-4))" },
];
const participationChartConfig = { tasks: { label: "Tarefas" } } satisfies ChartConfig;

const impediments = [
    { id: 1, description: "API de pagamentos externa está indisponível.", task: "Implementar checkout", priority: "Alta" },
    { id: 2, description: "Acesso ao ambiente de produção pendente.", task: "Deploy da v1", priority: "Média" },
    { id: 3, description: "Dúvida sobre a regra de negócio do cálculo de frete.", task: "Desenvolver módulo de frete", priority: "Baixa" }
];


export default function ScrumAnalyticsPage() {
  useEffect(() => {
    document.title = `Análise Scrum (DEV) - ${APP_NAME}`;
  }, []);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scrum Analytics (DEV)"
        description="Métricas e insights visuais sobre o desempenho e progresso dos seus projetos Scrum."
        icon={<PieChartIcon className="h-6 w-6 text-primary" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Dias Restantes</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><Clock className="h-10 w-10 text-primary"/><p className="text-4xl font-bold">10</p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Tarefas Concluídas</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><CheckCircle className="h-10 w-10 text-emerald-500"/><p className="text-4xl font-bold">8 / 12</p></CardContent>
            </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
                <CardHeader><CardTitle className="font-headline text-lg">Impedimentos Ativos</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4"><Flag className="h-10 w-10 text-destructive"/><p className="text-4xl font-bold">{impediments.length}</p></CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><BarChart /> Velocity Chart</CardTitle>
              <CardDescription>Story Points concluídos por Sprint.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={velocityChartConfig} className="w-full h-64">
                <BarChartRecharts accessibilityLayer data={velocityData}>
                   <CartesianGrid vertical={false} />
                   <XAxis dataKey="sprint" tickLine={false} tickMargin={10} axisLine={false} />
                   <YAxis />
                   <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                   <Bar dataKey="points" fill="var(--color-points)" radius={4} />
                </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><LineChart /> Burndown Chart (Sprint Atual)</CardTitle>
              <CardDescription>Progresso do trabalho restante vs. ideal.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={burndownChartConfig} className="w-full h-64">
                    <AreaChartRecharts accessibilityLayer data={burndownData}>
                         <CartesianGrid vertical={false} />
                         <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
                         <YAxis label={{ value: 'Pontos', angle: -90, position: 'insideLeft' }}/>
                         <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                         <ChartLegend content={<ChartLegendContent />} />
                         <Area dataKey="ideal" type="monotone" fill="var(--color-ideal)" fillOpacity={0.2} stroke="var(--color-ideal)" strokeDasharray="5 5" stackId="a" />
                         <Area dataKey="real" type="monotone" fill="var(--color-real)" fillOpacity={0.4} stroke="var(--color-real)" stackId="b" />
                    </AreaChartRecharts>
                </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon /> Participação do Time</CardTitle>
              <CardDescription>Distribuição de tarefas concluídas na sprint.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={participationChartConfig} className="w-full h-64">
                  <PieChartRecharts accessibilityLayer>
                      <RechartsTooltip cursor={true} content={<ChartTooltipContent hideLabel />} />
                      <Pie data={participationData} dataKey="tasks" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {participationData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                      </Pie>
                  </PieChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Flag /> Impedimentos Ativos</CardTitle>
              <CardDescription>Bloqueios que precisam de atenção imediata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {impediments.map(imp => (
                <div key={imp.id} className="p-2 border-l-4 rounded-r-md bg-muted/50" style={{ borderLeftColor: imp.priority === "Alta" ? "hsl(var(--destructive))" : imp.priority === "Média" ? "hsl(var(--chart-2))" : "hsl(var(--muted-foreground))" }}>
                    <p className="font-medium text-sm">{imp.description}</p>
                    <p className="text-xs text-muted-foreground">Tarefa: {imp.task}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
