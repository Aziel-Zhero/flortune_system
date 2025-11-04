// src/app/(app)/corporate/reports/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Clock, ListChecks, CheckCircle, GitCommit } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const dailyProductivityData = [
    { day: "Seg", tasks: 8 }, { day: "Ter", tasks: 12 }, { day: "Qua", tasks: 7 },
    { day: "Qui", tasks: 15 }, { day: "Sex", tasks: 10 }, { day: "Sáb", tasks: 3 },
    { day: "Dom", tasks: 1 },
];
const productivityChartConfig = {
    tasks: { label: "Tarefas Concluídas", color: "hsl(var(--chart-1))" },
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
        description="Visualize a produtividade diária e as atividades recentes da sua equipe."
        icon={<AreaChart className="h-6 w-6 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle className="font-headline flex items-center gap-2">Produtividade Diária da Equipe</CardTitle><CardDescription>Acompanhe o número de tarefas concluídas a cada dia da semana.</CardDescription></CardHeader>
            <CardContent className="h-80">
              <ChartContainer config={productivityChartConfig} className="w-full h-full">
                <BarChartRecharts accessibilityLayer data={dailyProductivityData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
            <Card>
                <CardHeader><CardTitle className="font-headline">Feed de Atividades da Equipe</CardTitle><CardDescription>O que sua equipe está trabalhando agora.</CardDescription></CardHeader>
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
      </div>
    </div>
  );
}
